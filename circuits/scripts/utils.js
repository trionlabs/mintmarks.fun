import fs from 'fs';
import { generateEmailVerifierInputs, verifyDKIMSignature } from '@zk-email/zkemail-nr';

// Prepare all circuit inputs from an email file
export async function prepareCircuitInputs(emlPath) {
  const email = fs.readFileSync(emlPath);

  // Generate base inputs (signature, header, pubkey)
  const baseInputs = await generateEmailVerifierInputs(email, {
    maxHeadersLength: 2048, // Matches MAX_EMAIL_HEADER_LENGTH in circuit
    ignoreBodyHashCheck: true, // We don't verify body hash in our circuit
  });

  // Get DKIM result for headers and metadata
  const dkimResult = await verifyDKIMSignature(email, undefined, undefined, true);
  const headers = dkimResult.headers;

  // Extract header sequences
  const dateHeaderSequence = getConstrainedHeaderSequence(headers, 'date');
  const dateValueSequence = getHeaderValueSequence(dateHeaderSequence, 'date');
  const subjectHeaderSequence = getConstrainedHeaderSequence(headers, 'subject');
  const subjectValueSequence = getHeaderValueSequence(subjectHeaderSequence, 'subject');
  const eventNameSequence = getEventNameSequence(headers, subjectValueSequence);

  // Extract human-readable values for metadata
  const dateValue = headers.subarray(
    parseInt(dateValueSequence.index),
    parseInt(dateValueSequence.index) + parseInt(dateValueSequence.length)
  ).toString().trim();

  const subjectValue = headers.subarray(
    parseInt(subjectValueSequence.index),
    parseInt(subjectValueSequence.index) + parseInt(subjectValueSequence.length)
  ).toString().trim();

  const eventName = headers.subarray(
    parseInt(eventNameSequence.index),
    parseInt(eventNameSequence.index) + parseInt(eventNameSequence.length)
  ).toString().trim();

  const inputs = {
    header: baseInputs.header,
    pubkey: baseInputs.pubkey,
    signature: baseInputs.signature,
    date_header_sequence: dateHeaderSequence,
    date_value_sequence: dateValueSequence,
    subject_header_sequence: subjectHeaderSequence,
    subject_value_sequence: subjectValueSequence,
    event_name_sequence: eventNameSequence,
  };

  const metadata = {
    emailSize: email.length,
    headersSize: headers.length,
    domain: dkimResult.domain || 'unknown',
    date: dateValue,
    subject: subjectValue,
    eventName: eventName,
  };

  return { inputs, metadata };
}

// Get the index and length of a header field (case-insensitive, constrained to actual header)
// Skips DKIM-Signature headers to avoid finding fields inside the h= list
export function getConstrainedHeaderSequence(headers, fieldName) {
  const headerStr = headers.toString();

  // Build regex for case-insensitive header field
  const regex = new RegExp(
    `[${fieldName[0].toUpperCase()}${fieldName[0].toLowerCase()}]${fieldName.slice(1).toLowerCase()}:.*?(?=\\r?\\n(?![\\t ]))`
  );

  // Find all DKIM-Signature header ranges to skip them
  const dkimRanges = [];
  const dkimRegex = /DKIM-Signature:.*?(?=\r?\n(?![\t ]))/gs;
  let dkimMatch;
  while ((dkimMatch = dkimRegex.exec(headerStr)) !== null) {
    dkimRanges.push({
      start: dkimMatch.index,
      end: dkimMatch.index + dkimMatch[0].length
    });
  }

  // Find the header field outside DKIM ranges
  const matches = [...headerStr.matchAll(new RegExp(regex, 'g'))];
  for (const match of matches) {
    const matchStart = match.index;

    // Check if this match is inside a DKIM-Signature header
    const insideDkim = dkimRanges.some(
      range => matchStart >= range.start && matchStart <= range.end
    );

    if (!insideDkim) {
      return {
        index: matchStart.toString(),
        length: match[0].length.toString()
      };
    }
  }

  throw new Error(`Header field "${fieldName}" not found outside DKIM headers`);
}

// Get the sequence for just the header value (after "fieldname:")
// Note: DKIM canonicalized headers are lowercase with no space after colon
export function getHeaderValueSequence(headerSequence, fieldName) {
  const headerIndex = parseInt(headerSequence.index);
  const headerLength = parseInt(headerSequence.length);

  // Canonicalized headers are lowercase with no space: "fieldname:value"
  // Note: The regex lookahead (?=\r?\n) stops before the \r\n, so no trailing bytes are included
  const prefixLength = fieldName.length + 1; // "fieldname:" = name + ":"

  // Value starts after "fieldname:"
  const valueIndex = headerIndex + prefixLength;

  // Value length is total length minus prefix (no trailing bytes in regex match)
  const valueLength = headerLength - prefixLength;

  return {
    index: valueIndex.toString(),
    length: valueLength.toString()
  };
}

// Extract event name from subject line
// Luma emails have subject like "Thanks for joining <Event Name>"
export function getEventNameSequence(headers, subjectValueSequence) {
  const valueIndex = parseInt(subjectValueSequence.index);
  const valueLength = parseInt(subjectValueSequence.length);

  // Extract the subject value bytes
  const subjectValue = headers.subarray(valueIndex, valueIndex + valueLength).toString();

  // Look for "Thanks for joining " prefix
  const prefix = 'Thanks for joining ';
  const prefixIndex = subjectValue.indexOf(prefix);

  if (prefixIndex !== -1) {
    // Event name starts after the prefix
    const eventNameOffset = prefixIndex + prefix.length;
    const eventNameIndex = valueIndex + eventNameOffset;
    const eventNameLength = valueLength - eventNameOffset;

    return {
      index: eventNameIndex.toString(),
      length: eventNameLength.toString()
    };
  }

  // Fallback: use entire subject value as event name
  return subjectValueSequence;
}

// Decode BoundedVec<u8, N> from witness return values
// BoundedVec from Noir is returned as an object with storage and len fields
export function decodeBoundedVec(boundedVec) {
  // Check if it's an object with storage and len (Noir BoundedVec structure)
  if (boundedVec && typeof boundedVec === 'object' && 'storage' in boundedVec && 'len' in boundedVec) {
    const length = parseInt(boundedVec.len);
    const storage = boundedVec.storage;

    if (!Array.isArray(storage) || length === 0) {
      return '';
    }

    const bytes = storage.slice(0, length);
    return Buffer.from(bytes.map(b => parseInt(b))).toString('utf-8');
  }

  // Fallback: try array format where first element is length
  if (Array.isArray(boundedVec) && boundedVec.length > 0) {
    const length = parseInt(boundedVec[0]);
    const bytes = boundedVec.slice(1, length + 1);
    return Buffer.from(bytes.map(b => parseInt(b))).toString('utf-8');
  }

  return '';
}