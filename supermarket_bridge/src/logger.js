const STREAMS = {
  log: process.stdout,
  info: process.stdout,
  warn: process.stderr,
  error: process.stderr
};

let installed = false;

function installLogger() {
  if (installed) return;
  installed = true;

  for (const level of Object.keys(STREAMS)) {
    console[level] = (...args) => {
      write(level, args);
    };
  }
}

function write(level, args) {
  const stream = STREAMS[level] || process.stdout;
  const message = clean(args.map(formatArg).join(' '));
  const lines = message.split(/\r?\n/);

  for (const line of lines) {
    stream.write(`${timestamp()} ${line}\n`);
  }
}

function formatArg(value) {
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function clean(value) {
  return stripEmoji(redactSecrets(String(value)));
}

function redactSecrets(value) {
  let redacted = value
    .replace(/(--password\s+)(\S+)/gi, '$1[redacted]')
    .replace(/(--email\s+)(\S+)/gi, '$1[redacted]')
    .replace(/(SUPERMARKET_PASSWORD=)(\S+)/gi, '$1[redacted]')
    .replace(/(SAINSBURYS_PASSWORD=)(\S+)/gi, '$1[redacted]');

  for (const secret of knownSecrets()) {
    redacted = redacted.split(secret).join('[redacted]');
  }

  return redacted;
}

function knownSecrets() {
  return [
    process.env.SAINSBURYS_EMAIL,
    process.env.SUPERMARKET_EMAIL,
    process.env.SAINSBURYS_PASSWORD,
    process.env.SUPERMARKET_PASSWORD,
    process.env.HA_TOKEN,
    process.env.SUPERVISOR_TOKEN
  ].filter((value) => value && String(value).length >= 4);
}

function stripEmoji(value) {
  return value
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0E\uFE0F]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trimEnd();
}

function timestamp() {
  return new Date().toISOString();
}

module.exports = {
  installLogger,
  clean
};
