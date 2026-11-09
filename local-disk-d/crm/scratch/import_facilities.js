const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tglpiduukpekznpptbho.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnbHBpZHV1a3Bla3pucHB0YmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzNjQwOTcsImV4cCI6MjEwMzk0MDA5N30.O8wBJQNdcq-9VinHNdkJn2wUdZ0W9TT7mO3AYOkclts'
);

const csvRaw = fs.readFileSync(path.join(__dirname, 'data.csv'), 'utf8');

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parseName(fullName) {
  if (!fullName) return { first_name: 'Administrator', last_name: 'Staff' };
  let clean = fullName.replace(/^(MR\.|MS\.|MRS\.|DR\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' ')
  };
}

async function runImport() {
  const lines = csvRaw.split('\n').map(l => l.trim()).filter(Boolean);
  const header = parseCSVLine(lines[0]);
  console.log('Total records to import:', lines.length - 1);

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 5) continue;

    const [
      facilityId,
      medicareCcn,
      name,
      address,
      city,
      state,
      zip,
      county,
      telephone,
      administrator,
      email,
      owner,
      ownershipType,
      bedCount,
      licenseIssued,
      licenseEffective,
      licenseExpiration,
      licenseType
    ] = row;

    const { first_name, last_name } = parseName(administrator);
    const parsedBeds = parseInt(bedCount, 10) || null;

    const extraNotes = [
      facilityId ? `Facility ID: ${facilityId}` : '',
      medicareCcn ? `Medicare CCN: ${medicareCcn}` : '',
      owner ? `Owner: ${owner}` : '',
      licenseIssued ? `License Issued: ${licenseIssued}` : '',
      licenseEffective ? `License Effective: ${licenseEffective}` : '',
      licenseExpiration ? `License Exp: ${licenseExpiration}` : ''
    ].filter(Boolean).join(' | ');

    records.push({
      facility_name: name || 'Unnamed Facility',
      first_name: first_name || 'Administrator',
      last_name: last_name || '',
      administrator: administrator || null,
      email: email ? email.toLowerCase() : null,
      phone: telephone || null,
      address: address || null,
      city: city || null,
      state: state || 'PA',
      zip_code: zip || null,
      county: county || null,
      beds: parsedBeds,
      ownership_type: ownershipType || null,
      license_status: licenseType || null,
      contact_status_notes: extraNotes || null,
      type: 'Facility',
      pipeline_stage: 'Lead',
      is_priority_region: false
    });
  }

  console.log('Prepared rows:', records.length);

  // Insert in batches of 40
  const batchSize = 40;
  let inserted = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const { data, error } = await supabase.from('srimatric').insert(batch).select();
    if (error) {
      console.error('Batch error at ' + i + ':', error);
    } else {
      inserted += data.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${data.length} rows (total: ${inserted})`);
    }
  }

  const { count } = await supabase.from('srimatric').select('*', { count: 'exact', head: true });
  console.log('FINAL SRIMATRIC ROW COUNT IN SUPABASE:', count);
}

runImport().catch(console.error);
