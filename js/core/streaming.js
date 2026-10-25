// Incrementally decodes only the top-level JSON "content" string. Tool arguments
// stay buffered until the final envelope and their schemas have been validated.
export class ContentEnvelopeDecoder {
  constructor() {
    this.state = 'prefix'; this.prefix = ''; this.key = ''; this.keyRaw = '';
    this.escaped = false; this.unicode = ''; this.unicodeLeft = 0;
    this.depth = 0; this.inString = false; this.skipEscaped = false;
    this.contentSeen = false; this.content = ''; this.pendingHigh = '';
    this.inputChars = 0;
  }
  fail() {
    const error = new Error(`The webpage returned an invalid streaming tool envelope (state=${this.state}, received_chars=${this.inputChars}).`);
    error.status = 502; error.code = 'invalid_tool_response';
    error.details = { parserState: this.state, receivedCharacters: this.inputChars };
    throw error;
  }
  push(delta) {
    this.inputChars += delta.length;
    let input = delta;
    let output = '';
    if (this.state === 'prefix') {
      this.prefix += delta;
      const index = this.prefix.indexOf('{');
      if (index < 0) {
        if (this.prefix.trim().length > 32) this.fail();
        return '';
      }
      const prefix = this.prefix.slice(0, index).trim();
      if (prefix && !/^```(?:json)?$/i.test(prefix)) this.fail();
      input = this.prefix.slice(index + 1); this.prefix = ''; this.state = 'keyStart';
    }
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (this.state === 'finished') continue; // final JSON.parse validates trailing text
      if (this.state === 'keyStart') {
        if (/\s/.test(char)) continue;
        if (char === '}') { this.state = 'finished'; continue; }
        if (char !== '"') this.fail();
        this.keyRaw = '"'; this.escaped = false; this.state = 'keyString'; continue;
      }
      if (this.state === 'keyString') {
        this.keyRaw += char;
        if (this.escaped) { this.escaped = false; continue; }
        if (char === '\\') { this.escaped = true; continue; }
        if (char === '"') {
          try { this.key = JSON.parse(this.keyRaw); } catch { this.fail(); }
          this.state = 'colon';
        }
        continue;
      }
      if (this.state === 'colon') {
        if (/\s/.test(char)) continue;
        if (char !== ':') this.fail();
        this.state = 'value'; continue;
      }
      if (this.state === 'value') {
        if (/\s/.test(char)) continue;
        if (this.key === 'content' && char === '"') {
          if (this.contentSeen) this.fail();
          this.contentSeen = true; this.state = 'content'; this.escaped = false; continue;
        }
        this.state = 'skip'; this.depth = 0; this.inString = false; this.skipEscaped = false;
        // Process this first value character using the same skip lexer below.
      }
      if (this.state === 'skip') {
        if (this.inString) {
          if (this.skipEscaped) this.skipEscaped = false;
          else if (char === '\\') this.skipEscaped = true;
          else if (char === '"') this.inString = false;
        } else if (char === '"') this.inString = true;
        else if (char === '{' || char === '[') this.depth++;
        else if (char === ']' || char === '}') {
          if (char === '}' && this.depth === 0) this.state = 'finished';
          else this.depth--;
        } else if (char === ',' && this.depth === 0) this.state = 'keyStart';
        continue;
      }
      if (this.state === 'afterContent') {
        if (/\s/.test(char)) continue;
        if (char === ',') this.state = 'keyStart';
        else if (char === '}') this.state = 'finished';
        else this.fail();
        continue;
      }
      if (this.state === 'content') {
        if (this.unicodeLeft) {
          if (!/[0-9a-f]/i.test(char)) this.fail();
          this.unicode += char;
          if (--this.unicodeLeft === 0) { output += String.fromCharCode(parseInt(this.unicode, 16)); this.unicode = ''; }
        } else if (this.escaped) {
          this.escaped = false;
          if (char === 'u') { this.unicodeLeft = 4; this.unicode = ''; }
          else {
            const escapes = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
            if (!(char in escapes)) this.fail();
            output += escapes[char];
          }
        } else if (char === '\\') this.escaped = true;
        else if (char === '"') this.state = 'afterContent';
        else if (char.charCodeAt(0) < 32) this.fail();
        else output += char;
      }
    }
    output = this.pendingHigh + output;
    this.pendingHigh = '';
    for (let i = 0; i < output.length; i++) {
      const point = output.charCodeAt(i);
      if (point >= 0xd800 && point <= 0xdbff) {
        if (i === output.length - 1 && this.state === 'content') { this.pendingHigh = output[i]; output = output.slice(0, -1); break; }
        const low = output.charCodeAt(++i);
        if (!(low >= 0xdc00 && low <= 0xdfff)) this.fail();
      } else if (point >= 0xdc00 && point <= 0xdfff) this.fail();
    }
    this.content += output;
    return output;
  }
}
