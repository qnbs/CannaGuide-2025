import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsView } from './SettingsView';
import { defaultSettings } from '@/stores/slices/settingsSlice';

const mockDispatch = vi.fn();

vi.mock('@/stores/store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/stores/store')>();
  return {
    ...actual,
    useAppDispatch: vi.fn(() => mockDispatch),
    useAppSelector: vi.fn((selector: (state: any) => any) =>
      selector({ settings: { settings: defaultSettings } }),
    ),
  };
});

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  };
});

vi.mock('@/services/apiKeyService', () => ({
  apiKeyService: {
    getApiKey: vi.fn().mockResolvedValue(null),
    getMaskedApiKey: vi.fn().mockResolvedValue(null),
    getApiKeyMetadata: vi.fn().mockResolvedValue(null),
    isApiKeyRotationDue: vi.fn().mockReturnValue(false),
    setApiKey: vi.fn().mockResolvedValue(undefined),
    validateApiKey: vi.fn().mockResolvedValue(undefined),
    validateStoredApiKey: vi.fn().mockResolvedValue(undefined),
    clearApiKey: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('./VoiceSettingsTab', () => ({
  default: () => <div>VoiceSettingsTabMock</div>,
}));

vi.mock('./StrainsSettingsTab', () => ({
  default: () => <div>StrainsSettingsTabMock</div>,
}));

vi.mock('./DataManagementTab', () => ({
  default: () => <div>DataManagementTabMock</div>,
}));

vi.mock('./AboutTab', () => ({
  default: () => <div>AboutTabMock</div>,
}));

describe('SettingsView navigation smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tabCases = [
    { label: 'settingsView.categories.general', expectedHeading: /settingsView.categories.general/i },
    { label: 'settingsView.categories.tts', expected: /VoiceSettingsTabMock/i },
    { label: 'settingsView.categories.strains', expected: /StrainsSettingsTabMock/i },
    { label: 'settingsView.categories.plants', expected: /settingsView.plants.realtimeEngine/i },
    { label: 'settingsView.categories.notifications', expected: /^settingsView.notifications.enableAll$/i },
    { label: 'settingsView.categories.defaults', expected: /settingsView.defaults.growSetup/i },
    { label: 'settingsView.categories.privacy', expected: /^settingsView.privacy.requirePin$/i },
    { label: 'settingsView.categories.data', expected: /DataManagementTabMock/i },
    { label: 'settingsView.categories.about', expected: /AboutTabMock/i },
  ];

  it.each(tabCases)('opens tab %s without crash', async ({ label, expected, expectedHeading }) => {
    render(<SettingsView />);

    fireEvent.click(screen.getByRole('button', { name: label }));

    if (expectedHeading) {
      expect(await screen.findByRole('heading', { name: expectedHeading })).toBeInTheDocument();
    } else {
      expect(await screen.findByText(expected)).toBeInTheDocument();
    }
    expect(screen.queryByText('Something went wrong.')).not.toBeInTheDocument();
    expect(screen.queryByText('An unexpected error occurred.')).not.toBeInTheDocument();
  });
});
