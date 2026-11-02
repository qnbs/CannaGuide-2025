import React from 'react'
import type { Strain } from '@/types'
import {
    AromaProfileSection,
    ChemovarSection,
    EntourageSection,
    FlavonoidProfileSection,
    TerpeneDetailSection,
} from './profileSections'

export const ProfileTab: React.FC<{ strain: Strain }> = ({ strain }) => (
    <div className="space-y-6">
        <AromaProfileSection strain={strain} />
        <TerpeneDetailSection profile={strain.terpeneProfile} />
        <FlavonoidProfileSection profile={strain.flavonoidProfile} />
        <ChemovarSection profile={strain.chemovarProfile} />
        <EntourageSection
            terpeneProfile={strain.terpeneProfile}
            cannabinoidProfile={strain.cannabinoidProfile}
        />
    </div>
)
