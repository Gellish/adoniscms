const start = async () => {
    const eventId = `evt_${Date.now()}`;
    const payload = {
        title: `FileStore Test Post ${Date.now()}`,
        content: 'Content from file store sync test',
        slug: `file-post-${Date.now()}`
    };

    const body = {
        events: [
            {
                eventId: eventId,
                type: 'PostCreated',
                payload: payload,
                meta: { source: 'test_script' },
                timestamp: new Date().toISOString(),
                aggregateId: `agg_${Date.now()}`,
                aggregateType: 'post'
            }
        ]
    };

    console.log('Sending sync request...');
    try {
        const res = await fetch('http://localhost:3333/api/events/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Data:', data);

        if (res.ok) {
            console.log('SUCCESS: Sync worked. Check storage/events/aggregates/post/...');
        } else {
            console.error('FAILED: Sync failed.');
        }

        // Check list
        const resList = await fetch('http://localhost:3333/api/events');
        const list = await resList.json();
        console.log(`Event List Count: ${list.length}`);

    } catch (e) {
        console.error('ERROR:', e.message);
    }
};

start();
