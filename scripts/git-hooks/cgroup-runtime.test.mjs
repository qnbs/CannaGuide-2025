import assert from 'node:assert/strict'
import test from 'node:test'

import { readCgroupStatus } from './hook-runtime.mjs'

test('cgroup v2 headroom includes a constrained ancestor of an unbounded leaf', () => {
    const files = new Map([
        ['/proc/self/cgroup', '0::/slice/app/leaf\n'],
        ['/proc/self/mountinfo', '1 0 0:1 / /sys/fs/cgroup rw - cgroup2 cgroup rw\n'],
        ['/sys/fs/cgroup/slice/app/leaf/memory.max', 'max\n'],
        ['/sys/fs/cgroup/slice/app/leaf/memory.current', '0\n'],
        ['/sys/fs/cgroup/slice/app/leaf/memory.swap.max', 'max\n'],
        ['/sys/fs/cgroup/slice/app/leaf/memory.swap.current', '0\n'],
        ['/sys/fs/cgroup/slice/app/memory.max', '943718400\n'],
        ['/sys/fs/cgroup/slice/app/memory.current', '268435456\n'],
        ['/sys/fs/cgroup/slice/app/memory.swap.max', '268435456\n'],
        ['/sys/fs/cgroup/slice/app/memory.swap.current', '0\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path)),
        {
            memoryAvailableMb: 644,
            totalAvailableMb: 900,
            version: 2,
        },
    )
})

test('cgroup membership equal to the mount root maps directly to the mount point', () => {
    const files = new Map([
        ['/proc/self/cgroup', '0::/slice/app\n'],
        ['/proc/self/mountinfo', '1 0 0:1 /slice/app /sys/fs/cgroup rw - cgroup2 cgroup rw\n'],
        ['/sys/fs/cgroup/memory.max', '1073741824\n'],
        ['/sys/fs/cgroup/memory.current', '268435456\n'],
        ['/sys/fs/cgroup/memory.swap.max', '0\n'],
        ['/sys/fs/cgroup/memory.swap.current', '0\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path)),
        {
            memoryAvailableMb: 768,
            totalAvailableMb: 768,
            version: 2,
        },
    )
})

test('cgroup status selects the mount whose root contains the process membership', () => {
    const files = new Map([
        ['/proc/self/cgroup', '0::/slice/app\n'],
        [
            '/proc/self/mountinfo',
            '1 0 0:1 /other /sys/fs/cgroup/other rw - cgroup2 cgroup rw\n' +
                '2 0 0:2 /slice /sys/fs/cgroup/slice rw - cgroup2 cgroup rw\n',
        ],
        ['/sys/fs/cgroup/slice/app/memory.max', '1073741824\n'],
        ['/sys/fs/cgroup/slice/app/memory.current', '268435456\n'],
        ['/sys/fs/cgroup/slice/app/memory.swap.max', '0\n'],
        ['/sys/fs/cgroup/slice/app/memory.swap.current', '0\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path)),
        {
            memoryAvailableMb: 768,
            totalAvailableMb: 768,
            version: 2,
        },
    )
})

test('cgroup mountinfo paths are decoded before membership matching and reads', () => {
    const directory = '/sys/fs/cgroup space/app'
    const files = new Map([
        ['/proc/self/cgroup', '0::/slice root/app\n'],
        [
            '/proc/self/mountinfo',
            '1 0 0:1 /slice\\040root /sys/fs/cgroup\\040space rw - cgroup2 cgroup rw\n',
        ],
        [`${directory}/memory.max`, '1073741824\n'],
        [`${directory}/memory.current`, '268435456\n'],
        [`${directory}/memory.swap.max`, '0\n'],
        [`${directory}/memory.swap.current`, '0\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path)),
        {
            memoryAvailableMb: 768,
            totalAvailableMb: 768,
            version: 2,
        },
    )
})

test('hybrid cgroups fall back to a readable v1 memory controller', () => {
    const directory = '/sys/fs/cgroup/memory/legacy/app'
    const files = new Map([
        ['/proc/self/cgroup', '0::/unified/app\n5:memory:/legacy/app\n'],
        [
            '/proc/self/mountinfo',
            '1 0 0:1 / /sys/fs/cgroup/unified rw - cgroup2 cgroup rw\n' +
                '2 0 0:2 / /sys/fs/cgroup/memory rw - cgroup cgroup rw,memory\n',
        ],
        [`${directory}/memory.limit_in_bytes`, '1073741824\n'],
        [`${directory}/memory.usage_in_bytes`, '268435456\n'],
        [`${directory}/memory.memsw.limit_in_bytes`, '1610612736\n'],
        [`${directory}/memory.memsw.usage_in_bytes`, '536870912\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path)),
        {
            memoryAvailableMb: 768,
            totalAvailableMb: 1024,
            version: 1,
        },
    )
})

test('unbounded cgroup v2 swap is capped by host swap availability', () => {
    const directory = '/sys/fs/cgroup/app'
    const files = new Map([
        ['/proc/self/cgroup', '0::/app\n'],
        ['/proc/self/mountinfo', '1 0 0:1 / /sys/fs/cgroup rw - cgroup2 cgroup rw\n'],
        [`${directory}/memory.max`, '1073741824\n'],
        [`${directory}/memory.current`, '234881024\n'],
        [`${directory}/memory.swap.max`, 'max\n'],
        [`${directory}/memory.swap.current`, '0\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path), { hostSwapFreeMb: 50 }),
        {
            memoryAvailableMb: 800,
            totalAvailableMb: 850,
            version: 2,
        },
    )
})

test('cgroup v1 memsw is treated as combined headroom', () => {
    const directory = '/sys/fs/cgroup/memory/docker/app'
    const files = new Map([
        ['/proc/self/cgroup', '5:memory:/docker/app\n'],
        ['/proc/self/mountinfo', '1 0 0:1 / /sys/fs/cgroup/memory rw - cgroup cgroup rw,memory\n'],
        [`${directory}/memory.limit_in_bytes`, '1073741824\n'],
        [`${directory}/memory.usage_in_bytes`, '268435456\n'],
        [`${directory}/memory.memsw.limit_in_bytes`, '1610612736\n'],
        [`${directory}/memory.memsw.usage_in_bytes`, '536870912\n'],
    ])
    assert.deepEqual(
        readCgroupStatus((path) => files.get(path)),
        {
            memoryAvailableMb: 768,
            totalAvailableMb: 1024,
            version: 1,
        },
    )
})
