/**
 * GoMate Live Cloud WhatsApp Booking Simulation
 * Runs an authentic trilingual farmer booking flow directly against the live cloud deployment.
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const CLOUD_URL = 'https://gomate-whatsapp-bot.onrender.com';

async function sendCloudMessage(phone, message) {
  try {
    const res = await fetch(`${CLOUD_URL}/api/simulator/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runLiveSimulation() {
  console.log('========================================================================');
  console.log('🚜 GoMate Live Cloud WhatsApp Booking Simulation (महाराष्ट्र शेतकरी संवाद)');
  console.log(`🌐 Target Endpoint: ${CLOUD_URL}`);
  console.log('========================================================================\n');

  const farmerPhone = '+919876543210';
  const steps = [
    { title: 'पायरी १: शेतकरी सुरुवातीचा मेसेज (Farmer Greeting)', input: 'नमस्कार' },
    { title: 'पायरी २: भाषा निवड - मराठी (Language Selection - Marathi)', input: '1' },
    { title: 'पायरी ३: भूमिका निवड - शेतकरी/ग्राहक (Role Selection - Farmer)', input: '1' },
    { title: 'पायरी ४: शेतकरी नाव नोंदणी (Farmer Name Onboarding)', input: 'रमेश पाटील' },
    { title: 'पायरी ५: मुख्य मेनू - मशिनरी शोधा (Customer Menu - Search Machinery)', input: '1' },
    { title: 'पायरी ६: श्रेणी निवड - शेती अवजारे (Category - Farm Machinery)', input: '1' },
    { title: 'पायरी ७: गाव / तालुका निवड - जत (Village/Taluka - Jath)', input: 'जत' },
    { title: 'पायरी ८: ट्रॅक्टर निवड (Equipment Selection - Option 1)', input: '1' },
    { title: 'पायरी ९: अवजार निवड - रोटाव्हेटर (Service - Rotavator)', input: '1' },
    { title: 'पायरी १०: तारीख व वेळ निवड (Date & Time)', input: '1' },
    { title: 'पायरी ११: कालावधी निवड - ४ तास (Duration - 4 Hours)', input: '4' }
  ];

  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`📌 ${s.title}`);
    console.log(`💬 शेतकरी इनपुट (Input): "${s.input}"`);
    console.log(`------------------------------------------------------------------------`);

    const result = await sendCloudMessage(farmerPhone, s.input);

    if (result.error) {
      console.error(`❌ Cloud API Error: ${result.error}`);
      break;
    }

    console.log(`🤖 GoMate बॉट उत्तर (Bot WhatsApp Reply):\n`);
    console.log(result.reply || result.data?.reply || JSON.stringify(result, null, 2));

    await sleep(800);
  }

  console.log('\n========================================================================');
  console.log('🎉 Live Cloud WhatsApp Booking Simulation Complete!');
  console.log('========================================================================\n');
}

runLiveSimulation();
