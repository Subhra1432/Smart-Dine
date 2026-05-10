import fetch from 'node-fetch';

async function test() {
  try {
    const res = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@spicegarden.com', password: 'owner123' })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

test();
