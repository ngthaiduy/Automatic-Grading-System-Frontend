const CARD_ADMIN_ICON = ['group', 'assignment', 'task', 'priority_high'];
const PIE_COLOR = ['#1D4ED8', '#60A5FA', '#CBD5E1'];

const ROLE_PIE_COLOR_BY_NAME = {
  STUDENT: '#1D4ED8',
  LECTURER: '#60A5FA',
  EXAM_STAFF: '#34D399',
  SYSTEM_ADMIN: '#F97316',
};

const ROLE_DASHBOARD_LABEL_VI = new Map([
  ['STUDENT', 'Sinh viên'],
  ['LECTURER', 'Giảng viên'],
  ['EXAM_STAFF', 'Khảo thí'],
  ['SYSTEM_ADMIN', 'Quản trị'],
]);

const AI_PROVIDERS = [
  ['gemini', 'Google Gemini'],
  ['openai', 'OpenAI'],
  ['deepseek', 'DeepSeek'],
  ['grok', 'xAI Grok'],
  ['claude', 'Anthropic Claude'],
  ['custom_openai', 'LM Studio / Custom OpenAI-compatible'],
];

const AI_PROVIDER_MODELS = {
  gemini: [
    ['gemini-3-flash-preview', 'Gemini 3 Flash'],
    ['gemini-2.5-pro', 'Gemini 2.5 Pro'],
    ['gemini-2.0-flash', 'Gemini 2.0 Flash'],
    ['gemini-1.5-pro', 'Gemini 1.5 Pro'],
  ],

  openai: [
    ['gpt-4o', 'GPT-4o'],
    ['gpt-4o-mini', 'GPT-4o Mini'],
    ['gpt-4.1', 'GPT-4.1'],
    ['gpt-4.1-mini', 'GPT-4.1 Mini'],
  ],

  deepseek: [
    ['deepseek-chat', 'DeepSeek Chat'],
    ['deepseek-reasoner', 'DeepSeek Reasoner'],
  ],

  grok: [
    ['grok-2', 'Grok 2'],
    ['grok-2-latest', 'Grok 2 Latest'],
  ],

  claude: [
    ['claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5'],
    ['claude-haiku-4-5-20251001', 'Claude Haiku 4.5'],
    ['claude-sonnet-4-20250514', 'Claude Sonnet 4'],
  ],

  custom_openai: [],
};

const LANGUAGE = [
  ['vi', 'Tiếng Việt'],
  ['en', 'Tiếng Anh'],
];

export {
  CARD_ADMIN_ICON,
  PIE_COLOR,
  ROLE_PIE_COLOR_BY_NAME,
  ROLE_DASHBOARD_LABEL_VI,
  AI_PROVIDERS,
  LANGUAGE,
  AI_PROVIDER_MODELS,
};
