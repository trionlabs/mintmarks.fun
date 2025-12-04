use std::{collections::bounded_vec::BoundedVec, hash::pedersen_hash};
use zkemail::{
    dkim::RSAPubkey, headers::constrain_header_field,
    KEY_LIMBS_2048, Sequence,
};

// Constants
global MAX_EMAIL_HEADER_LENGTH: u32 = 2048; // DKIM-signed headers
global MAX_DATE_LENGTH: u32 = 64;           // Date format (RFC2822) date format
global MAX_SUBJECT_LENGTH: u32 = 256;       // Event name in subject line

// Header field prefixes
global DATE_FIELD_PREFIX_LEN: u32 = 5;      // "date:", 5 bytes
global SUBJECT_FIELD_PREFIX_LEN: u32 = 8;   // "subject:", 8 bytes

// Luma "Thanks for joining" prefix - REQUIRED for valid attendance emails
// "Thanks for joining " = 19 bytes (including trailing space)
global THANKS_FOR_JOINING_PREFIX_LEN: u32 = 19;

/**
 * Mintmarks - Proof of Luma Event Attendance Circuit
 *
 * INPUTS:
 *   @param header - Email header
 *   @param pubkey - RSA-2048 DKIM public key
 *   @param signature - RSA-2048 DKIM signature
 *   @param date_header_sequence - Position of "Date:" header field
 *   @param date_value_sequence - Position of date value (after "Date: ")
 *   @param subject_header_sequence - Position of "Subject:" header field
 *   @param subject_value_sequence - Position of subject value (after "Subject: ")
 *   @param event_name_sequence - Position of event name within subject
 *
 * PUBLIC OUTPUTS:
 *   0, pubkey_hash: Field - Poseidon hash of DKIM public key
 *   1, email_nullifier: Field - Pedersen hash of signature
 *   2, date: BoundedVec<u8, 64> - Extracted timestamp
 *   3, event_name: BoundedVec<u8, 256> - Extracted event name
 */
fn main(
    header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    pubkey: RSAPubkey<KEY_LIMBS_2048>,
    signature: [Field; KEY_LIMBS_2048],
    date_header_sequence: Sequence,
    date_value_sequence: Sequence,
    subject_header_sequence: Sequence,
    subject_value_sequence: Sequence,
    event_name_sequence: Sequence,
) -> pub (
    Field,                               // pubkey_hash
    Field,                               // email_nullifier
    BoundedVec<u8, MAX_DATE_LENGTH>,     // date
    BoundedVec<u8, MAX_SUBJECT_LENGTH>,  // event_name
) {
    // STEP 1: Validate header length
    assert(header.len() <= MAX_EMAIL_HEADER_LENGTH, "Header exceeds maximum length");

    // STEP 2: Verify DKIM signature
    // Returns SHA256(header) but we don't need it as public output
    let _header_hash = pubkey.verify_dkim_signature(header, signature);

    // STEP 3: Extract and validate Date header
    let date_field_name = comptime { "date".as_bytes() };
    constrain_header_field::<MAX_EMAIL_HEADER_LENGTH, MAX_DATE_LENGTH, 4>(
        header,
        date_header_sequence,
        date_field_name,
    );

    // Validate date value is within date header (after "Date: " prefix)
    assert(
        date_value_sequence.index >= date_header_sequence.index + DATE_FIELD_PREFIX_LEN
            & date_value_sequence.end_index() <= date_header_sequence.end_index()
            & date_value_sequence.length > 0
            & date_value_sequence.length <= MAX_DATE_LENGTH,
        "Date value sequence invalid"
    );

    // Extract date value from header
    let date_value = extract_bytes::<MAX_DATE_LENGTH>(
        header,
        date_value_sequence.index,
        date_value_sequence.length
    );

    // STEP 4: Extract and validate Subject header
    let subject_field_name = comptime { "subject".as_bytes() };
    constrain_header_field::<MAX_EMAIL_HEADER_LENGTH, MAX_SUBJECT_LENGTH, 7>(
        header,
        subject_header_sequence,
        subject_field_name,
    );

    // Validate subject value is within subject header (after "Subject: " prefix)
    assert(
        subject_value_sequence.index >= subject_header_sequence.index + SUBJECT_FIELD_PREFIX_LEN
            & subject_value_sequence.end_index() <= subject_header_sequence.end_index()
            & subject_value_sequence.length > 0
            & subject_value_sequence.length <= MAX_SUBJECT_LENGTH,
        "Subject value sequence invalid"
    );

    // STEP 5: Validate "Thanks for joining " prefix in subject
    // This is CRITICAL for security - ensures only Luma attendance emails are accepted
    // Subject must be at least 20 chars: "Thanks for joining " (19) + event name (1+)
    assert(
        subject_value_sequence.length >= THANKS_FOR_JOINING_PREFIX_LEN + 1,
        "Subject too short for Thanks for joining prefix"
    );

    // Verify the subject starts with "Thanks for joining " (19 bytes)
    // "Thanks for joining " = [84,104,97,110,107,115,32,102,111,114,32,106,111,105,110,105,110,103,32]
    let thanks_prefix: [u8; 19] = [84, 104, 97, 110, 107, 115, 32, 102, 111, 114, 32, 106, 111, 105, 110, 105, 110, 103, 32];
    for i in 0..19 {
        let header_byte = header.get(subject_value_sequence.index + i);
        assert(header_byte == thanks_prefix[i], "Subject must start with Thanks for joining");
    }

    // STEP 6: Extract event name from subject
    // Event name MUST start exactly after "Thanks for joining " prefix
    assert(
        event_name_sequence.index == subject_value_sequence.index + THANKS_FOR_JOINING_PREFIX_LEN,
        "Event name must start after Thanks for joining prefix"
    );

    // Event name must end at or before subject value end
    assert(
        event_name_sequence.end_index() <= subject_value_sequence.end_index()
            & event_name_sequence.length > 0
            & event_name_sequence.length <= MAX_SUBJECT_LENGTH,
        "Event name sequence invalid"
    );

    // Extract event name from header
    let event_name = extract_bytes::<MAX_SUBJECT_LENGTH>(
        header,
        event_name_sequence.index,
        event_name_sequence.length
    );

    // STEP 6: Generate outputs
    let pubkey_hash = pubkey.hash(); // Poseidon hash of public key
    let email_nullifier = pedersen_hash(signature); // Pedersen hash of signature

    (pubkey_hash, email_nullifier, date_value, event_name)
}


// Helper, extract bytes from header at specified position
fn extract_bytes<let MAX_LENGTH: u32>(
    header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    start_index: u32,
    length: u32,
) -> BoundedVec<u8, MAX_LENGTH> {
    let mut result: BoundedVec<u8, MAX_LENGTH> = BoundedVec::new();
    let end_index = start_index + length;

    for i in 0..MAX_LENGTH {
        let index = start_index + i;
        if index < end_index {
            result.set_unchecked(i, header.get_unchecked(index));
        }
    }

    result.len = length;
    result
}

// =============================================================================
// TESTS
// =============================================================================

// Helper to create a test header with known content
// "subject:Thanks for joining Test Event\r\ndate:Sat, 22 Nov 2025"
fn create_test_header() -> BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH> {
    let mut header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH> = BoundedVec::new();

    // "subject:" (8 bytes)
    header.push(115); header.push(117); header.push(98); header.push(106);
    header.push(101); header.push(99); header.push(116); header.push(58);

    // "Thanks for joining " (19 bytes)
    header.push(84); header.push(104); header.push(97); header.push(110);
    header.push(107); header.push(115); header.push(32); header.push(102);
    header.push(111); header.push(114); header.push(32); header.push(106);
    header.push(111); header.push(105); header.push(110); header.push(105);
    header.push(110); header.push(103); header.push(32);

    // "Test Event" (10 bytes)
    header.push(84); header.push(101); header.push(115); header.push(116);
    header.push(32); header.push(69); header.push(118); header.push(101);
    header.push(110); header.push(116);

    // "\r\n" (2 bytes)
    header.push(13); header.push(10);

    // "date:" (5 bytes)
    header.push(100); header.push(97); header.push(116); header.push(101);
    header.push(58);

    // "Sat, 22 Nov 2025" (16 bytes)
    header.push(83); header.push(97); header.push(116); header.push(44);
    header.push(32); header.push(50); header.push(50); header.push(32);
    header.push(78); header.push(111); header.push(118); header.push(32);
    header.push(50); header.push(48); header.push(50); header.push(53);

    header // Total: 60 bytes
}

// -------------------------------------------------------------------------
// Validation Helper Functions (mirror main() assertions for testing)
// -------------------------------------------------------------------------

// Validates that value sequence is properly nested within header sequence
fn validate_value_in_header(
    value_index: u32,
    value_length: u32,
    header_index: u32,
    header_length: u32,
    prefix_len: u32,
    max_length: u32,
) {
    let header_end = header_index + header_length;
    let value_end = value_index + value_length;

    assert(
        value_index >= header_index + prefix_len
            & value_end <= header_end
            & value_length > 0
            & value_length <= max_length,
        "Value sequence invalid"
    );
}

// Validates event name is within subject value
fn validate_event_in_subject(
    event_index: u32,
    event_length: u32,
    subject_index: u32,
    subject_length: u32,
    max_length: u32,
) {
    let subject_end = subject_index + subject_length;
    let event_end = event_index + event_length;

    assert(
        event_index >= subject_index
            & event_end <= subject_end
            & event_length > 0
            & event_length <= max_length,
        "Event name sequence invalid"
    );
}

// -------------------------------------------------------------------------
// Should-Fail Tests: Verify circuit REJECTS invalid inputs
// -------------------------------------------------------------------------

#[test(should_fail_with = "Value sequence invalid")]
fn test_fail_value_before_prefix() {
    // Attack: value starts before prefix ends
    validate_value_in_header(
        102,  // value_index: only 2 bytes after header
        30,   // value_length
        100,  // header_index
        40,   // header_length
        5,    // prefix_len (e.g., "date:")
        64    // max_length
    );
}

#[test(should_fail_with = "Value sequence invalid")]
fn test_fail_value_extends_past_header() {
    // Attack: value extends beyond header boundary
    validate_value_in_header(
        110,  // value_index
        35,   // value_length: 110 + 35 = 145, but header ends at 140
        100,  // header_index
        40,   // header_length: ends at 140
        5,    // prefix_len
        64    // max_length
    );
}

#[test(should_fail_with = "Value sequence invalid")]
fn test_fail_zero_length_value() {
    // Attack: zero-length value
    validate_value_in_header(
        110,  // value_index
        0,    // value_length: ZERO
        100,  // header_index
        40,   // header_length
        5,    // prefix_len
        64    // max_length
    );
}

#[test(should_fail_with = "Value sequence invalid")]
fn test_fail_value_exceeds_max_length() {
    // Attack: value length exceeds maximum
    validate_value_in_header(
        105,  // value_index
        100,  // value_length: exceeds max of 64
        100,  // header_index
        200,  // header_length
        5,    // prefix_len
        64    // max_length
    );
}

#[test(should_fail_with = "Event name sequence invalid")]
fn test_fail_event_before_subject() {
    // Attack: event starts before subject
    validate_event_in_subject(
        95,   // event_index: before subject starts
        14,   // event_length
        100,  // subject_index
        33,   // subject_length
        256   // max_length
    );
}

#[test(should_fail_with = "Event name sequence invalid")]
fn test_fail_event_extends_past_subject() {
    // Attack: event extends beyond subject
    validate_event_in_subject(
        125,  // event_index
        20,   // event_length: 125 + 20 = 145, but subject ends at 133
        100,  // subject_index
        33,   // subject_length: ends at 133
        256   // max_length
    );
}

#[test(should_fail_with = "Event name sequence invalid")]
fn test_fail_zero_length_event() {
    // Attack: zero-length event name
    validate_event_in_subject(
        110,  // event_index
        0,    // event_length: ZERO
        100,  // subject_index
        33,   // subject_length
        256   // max_length
    );
}

// -------------------------------------------------------------------------
// Valid Input Tests: Verify validation PASSES for correct inputs
// -------------------------------------------------------------------------

#[test]
fn test_valid_date_sequence_from_real_email() {
    // Real data from luma_thanks_npc_short_name.eml
    // date_header: index=265, length=36
    // date_value: index=270, length=31
    validate_value_in_header(
        270,  // date_value_index
        31,   // date_value_length
        265,  // date_header_index
        36,   // date_header_length
        5,    // DATE_FIELD_PREFIX_LEN ("date:")
        64    // MAX_DATE_LENGTH
    );
}

#[test]
fn test_valid_subject_sequence_from_real_email() {
    // Real data from luma_thanks_npc_short_name.eml
    // subject_header: index=123, length=41
    // subject_value: index=131, length=33
    validate_value_in_header(
        131,  // subject_value_index
        33,   // subject_value_length
        123,  // subject_header_index
        41,   // subject_header_length
        8,    // SUBJECT_FIELD_PREFIX_LEN ("subject:")
        256   // MAX_SUBJECT_LENGTH
    );
}

#[test]
fn test_valid_event_sequence_from_real_email() {
    // Real data from luma_thanks_npc_short_name.eml
    // subject_value: index=131, length=33
    // event_name: index=150, length=14 ("NPC Side Event")
    validate_event_in_subject(
        150,  // event_name_index
        14,   // event_name_length
        131,  // subject_value_index
        33,   // subject_value_length
        256   // MAX_SUBJECT_LENGTH
    );
}

// -------------------------------------------------------------------------
// "Thanks for joining" Prefix Validation Tests (SECURITY CRITICAL)
// These tests verify that only Luma attendance emails are accepted
// -------------------------------------------------------------------------

// Helper to verify "Thanks for joining " prefix in a header
fn validate_thanks_prefix(
    header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH>,
    subject_value_index: u32,
    subject_value_length: u32,
) {
    // Subject must be long enough for prefix + at least 1 char event name
    assert(
        subject_value_length >= THANKS_FOR_JOINING_PREFIX_LEN + 1,
        "Subject too short for Thanks for joining prefix"
    );

    // "Thanks for joining " = [84,104,97,110,107,115,32,102,111,114,32,106,111,105,110,105,110,103,32]
    let thanks_prefix: [u8; 19] = [84, 104, 97, 110, 107, 115, 32, 102, 111, 114, 32, 106, 111, 105, 110, 105, 110, 103, 32];
    for i in 0..19 {
        let header_byte = header.get(subject_value_index + i);
        assert(header_byte == thanks_prefix[i], "Subject must start with Thanks for joining");
    }
}

// Helper to verify event name position after prefix
fn validate_event_after_prefix(
    event_name_index: u32,
    subject_value_index: u32,
) {
    assert(
        event_name_index == subject_value_index + THANKS_FOR_JOINING_PREFIX_LEN,
        "Event name must start after Thanks for joining prefix"
    );
}

#[test]
fn test_thanks_prefix_bytes_correct() {
    // Verify the prefix bytes match "Thanks for joining "
    let thanks_prefix: [u8; 19] = [84, 104, 97, 110, 107, 115, 32, 102, 111, 114, 32, 106, 111, 105, 110, 105, 110, 103, 32];

    // T=84, h=104, a=97, n=110, k=107, s=115, space=32
    assert(thanks_prefix[0] == 84, "T");
    assert(thanks_prefix[1] == 104, "h");
    assert(thanks_prefix[2] == 97, "a");
    assert(thanks_prefix[3] == 110, "n");
    assert(thanks_prefix[4] == 107, "k");
    assert(thanks_prefix[5] == 115, "s");
    assert(thanks_prefix[6] == 32, "space");

    // f=102, o=111, r=114, space=32
    assert(thanks_prefix[7] == 102, "f");
    assert(thanks_prefix[8] == 111, "o");
    assert(thanks_prefix[9] == 114, "r");
    assert(thanks_prefix[10] == 32, "space");

    // j=106, o=111, i=105, n=110, i=105, n=110, g=103, space=32
    assert(thanks_prefix[11] == 106, "j");
    assert(thanks_prefix[12] == 111, "o");
    assert(thanks_prefix[13] == 105, "i");
    assert(thanks_prefix[14] == 110, "n");
    assert(thanks_prefix[15] == 105, "i");
    assert(thanks_prefix[16] == 110, "n");
    assert(thanks_prefix[17] == 103, "g");
    assert(thanks_prefix[18] == 32, "trailing space");
}

#[test(should_fail_with = "Subject too short for Thanks for joining prefix")]
fn test_fail_subject_too_short() {
    let header = create_test_header();
    // Try with subject length of only 15 (less than 19 + 1 = 20)
    validate_thanks_prefix(header, 8, 15);
}

#[test(should_fail_with = "Subject must start with Thanks for joining")]
fn test_fail_wrong_prefix() {
    // Create a header that starts with "Welcome to" instead of "Thanks for joining"
    let mut header: BoundedVec<u8, MAX_EMAIL_HEADER_LENGTH> = BoundedVec::new();

    // "subject:" (8 bytes)
    header.push(115); header.push(117); header.push(98); header.push(106);
    header.push(101); header.push(99); header.push(116); header.push(58);

    // "Welcome to the " (15 bytes) - WRONG PREFIX
    header.push(87);  // W
    header.push(101); // e
    header.push(108); // l
    header.push(99);  // c
    header.push(111); // o
    header.push(109); // m
    header.push(101); // e
    header.push(32);  // space
    header.push(116); // t
    header.push(111); // o
    header.push(32);  // space
    header.push(116); // t
    header.push(104); // h
    header.push(101); // e
    header.push(32);  // space

    // "Event" (5 bytes)
    header.push(69); header.push(118); header.push(101); header.push(110); header.push(116);

    // This should fail because it starts with "Welcome to" not "Thanks for joining"
    validate_thanks_prefix(header, 8, 20);
}

#[test(should_fail_with = "Event name must start after Thanks for joining prefix")]
fn test_fail_event_wrong_position() {
    // Event name at index 25 instead of 27 (subject_value_index 8 + 19 = 27)
    validate_event_after_prefix(25, 8);
}