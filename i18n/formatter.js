// Writes src/i18n/transifex_input.json as { id: defaultMessage }, the shape openedx-translations expects.
exports.format = (messages) => Object.fromEntries(
  Object.entries(messages).map(([id, { defaultMessage }]) => [id, defaultMessage]),
);
