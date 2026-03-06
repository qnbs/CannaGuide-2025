import React, { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, CartesianGrid } from 'recharts'
import { Plant } from '@/types'
import { vpdService } from '@/services/plantSimulationService'
import { getVPDStatusAdvice, VPD_TARGET_BANDS } from '@/lib/vpd/recommendations'
import type { SimulationPoint } from '@/types/simulation.types'
import { useAppDispatch, useAppSelector } from '@/stores/store'
import { generatePlantVpdProfile } from '@/stores/slices/simulationSlice'
import { useTranslation } from 'react-i18next'

interface VPDChartProps {
  plant: Plant
}

export const VPDChart: React.FC<VPDChartProps> = ({ plant }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [data, setData] = useState<SimulationPoint[]>([])
  const profileFromStore = useAppSelector((state) => state.simulation.vpdProfiles?.[plant.id])

  const input = useMemo(() => vpdService.createInputFromPlant(plant), [plant])
  const band = VPD_TARGET_BANDS[input.phase]

  useEffect(() => {
    if (!profileFromStore || profileFromStore.length === 0) {
      dispatch(generatePlantVpdProfile(plant.id))
    }
  }, [dispatch, plant.id, profileFromStore])

  useEffect(() => {
    if (profileFromStore && profileFromStore.length > 0) {
      setData(profileFromStore)
      return
    }

    let mounted = true
    vpdService.runDailyVPD(input)
      .then((points) => {
        if (mounted) {
          setData(points)
        }
      })
      .catch(console.error)

    return () => {
      mounted = false
    }
  }, [input, profileFromStore])

  const latest = data[data.length - 1]

  return (
    <div className="space-y-3">
      <div className="h-64 w-full rounded-lg bg-slate-900/60 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <ReferenceArea y1={band.min} y2={band.max} fill="rgba(34,197,94,0.14)" />
            <Line type="monotone" dataKey="vpd" stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="targetVPD" stroke="#facc15" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            <XAxis dataKey="hour" tick={{ fontSize: 12 }} tickMargin={6} />
            <YAxis tick={{ fontSize: 12 }} domain={[0, 2.2]} tickMargin={6} />
            <Tooltip
              formatter={((value: number | undefined, name: string | undefined) => {
                if (value == null) return ['-', name ?? '']
                if (name === 'vpd' || name === 'targetVPD') return [`${value.toFixed(2)} kPa`, name]
                return [String(value), name ?? '']
              }) as never}
              contentStyle={{
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(148, 163, 184, 0.4)',
                borderRadius: 8,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {latest && (
        <div className="rounded-lg bg-slate-800/60 p-3 text-sm text-slate-200">
          <p className="font-semibold text-slate-100">{t('plantsView.vpd.currentVpd')}: {latest.vpd.toFixed(2)} kPa</p>
          <p className="text-slate-300">{t('plantsView.vpd.targetBand', { band: t(band.labelKey) })}: {band.min.toFixed(1)}-{band.max.toFixed(1)} kPa</p>
          <p className="text-slate-300">{t('plantsView.vpd.status')}: <span className="font-semibold uppercase">{latest.status}</span></p>
          <p className="text-slate-400">{getVPDStatusAdvice(latest.status)}</p>
        </div>
      )}
    </div>
  )
}
