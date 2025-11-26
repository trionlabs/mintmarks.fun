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
global DATE_FIELD_PREFIX_LEN: u32 = 5;      // "Date: ", 5 bytes
global SUBJECT_FIELD_PREFIX_LEN: u32 = 8;   // "Subject: ", 8 bytes

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

    // STEP 5: Extract event name from subject
    // Validate event name is within subject value
    assert(
        event_name_sequence.index >= subject_value_sequence.index
            & event_name_sequence.end_index() <= subject_value_sequence.end_index()
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