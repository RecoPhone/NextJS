'use client';
import { useState } from 'react';


export default function SubscribeButton({ priceId, label }: { priceId: string; label?: string }) {
const [loading, setLoading] = useState(false);


const onClick = async () => {
if (!priceId || priceId.includes('REPLACE_ME')) {
alert('⚠️ Remplace d’abord les Price IDs Stripe.');
return;
}
setLoading(true);
try {
const res = await fetch('/api/checkout/abonnement', {
method: 'POST',
headers: { 'content-type': 'application/json' },
body: JSON.stringify({ priceId }),
});
const data = await res.json();
if (data.url) window.location.href = data.url;
else alert(data.error ?? 'Une erreur est survenue');
} catch (e) {
alert('Erreur réseau.');
} finally {
setLoading(false);
}
};


return (
<button
onClick={onClick}
disabled={loading}
className="w-full rounded-2xl px-5 py-3 font-semibold text-white bg-[#54b435] hover:opacity-90 disabled:opacity-60"
>
{loading ? 'Redirection…' : (label ?? 'Souscrire')}
</button>
);
}