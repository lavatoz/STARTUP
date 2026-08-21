async function verify() {
  console.log('Testing authentication via backend /auth/login endpoint...');
  try {
    const response = await fetch('http://127.0.0.1:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@artisans.local',
        password: 'Admin@123'
      })
    });
    const status = response.status;
    const json: any = await response.json();
    console.log(`Response Status: ${status}`);
    console.log('Response JSON:', JSON.stringify(json, null, 2));
    if ((status === 200 || json.mfaRequired) || (status === 200 && json.accessToken)) {
      console.log('✅ Authentication SUCCESSFUL!');
    } else {
      console.log('❌ Authentication FAILED!');
    }
  } catch (error: any) {
    console.error('❌ Error calling backend:', error.message);
  }
}

verify();
