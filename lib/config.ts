// Which optional integrations are configured. Values are never sent to the browser.
export const aiConfigured = () => Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL);
export const sttConfigured = () => Boolean(process.env.STT_API_URL && process.env.STT_API_KEY && process.env.STT_MODEL);
