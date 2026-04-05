export default {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'docs',
                'refactor',
                'test',
                'perf',
                'chore',
                'ci',
                'build',
                'revert',
                'style',
                'a11y',
                'i18n',
            ],
        ],
    },
}
