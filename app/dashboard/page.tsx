'use client';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { Instagram,Download,CheckCircle2,Users,RotateCcw } from 'lucide-react';
import { api } from '@/lib/client';
import { useResource,ErrorBox,Busy } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Importer } from '@/components/importer';
import { WinnerReveal } from '@/components/winner-reveal';
import { DEFAULT_FILTERS } from '@/types/giveaway';
import type { Draw, Media, List, Settings } from '@/types/app';

function autoName() {
  return 'Tanlov — ' + new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Dashboard() {
  const integrations = useResource<{ integrations: unknown[]; metaConfigured: boolean; externalEnabled: boolean }>('instagram/integrations');
  const settings = useResource<Settings>('settings');

  const [url, setUrl] = useState(''), [media, setMedia] = useState<Media | null>(null), [sourceId, setSourceId] = useState('');
  const [page, setPage] = useState(0), [loaded, setLoaded] = useState(0), [complete, setComplete] = useState(false);
  const [requireFollowers, setRequireFollowers] = useState(false), [showFollowerImport, setShowFollowerImport] = useState(false), [followerList, setFollowerList] = useState<List | null>(null);
  const [requiredKeyword, setRequiredKeyword] = useState('');
  const [winnerCount, setWinnerCount] = useState<number | null>(null);
  const [isPublic, setPublic] = useState(true);
  const [giveaway, setGiveaway] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(''), [error, setError] = useState('');

  const connected = (integrations.data?.integrations.length ?? 0) > 0;
  const count = winnerCount ?? settings.data?.winnerCount ?? 1;

  async function resolve() {
    setBusy('resolve'); setError(''); setMedia(null); setSourceId(''); setLoaded(0); setPage(0); setComplete(false);
    try {
      const result = await api<{ sourceId: string; media: Media }>('instagram/media/resolve', { url, provider: 'META_OFFICIAL' });
      setMedia(result.media); setSourceId(result.sourceId);
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }

  async function loadComments() {
    setBusy('comments'); setError(''); let next = page;
    try {
      for (;;) {
        const result = await api<{ count: number; complete: boolean; page: number }>('instagram/media/comments', { sourceId, page: next });
        setLoaded(result.count); setPage(result.page); next = result.page;
        if (result.complete) { setComplete(true); break; }
      }
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }

  async function startDraw() {
    setBusy('start'); setError('');
    try {
      const filters = { ...DEFAULT_FILTERS, requiredKeyword, followerCheckMode: requireFollowers && followerList ? ('IMPORTED_FOLLOWERS_MATCH' as const) : ('NOT_CHECKED' as const), followerListId: requireFollowers ? followerList?.id ?? null : null };
      const created = await api<{ id: string; name: string }>('giveaways', { name: autoName(), sourceType: 'META_OFFICIAL', sourceId, filters });
      setGiveaway(created);
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }

  async function draw(): Promise<Draw> {
    const filters = { ...DEFAULT_FILTERS, requiredKeyword, followerCheckMode: requireFollowers && followerList ? ('IMPORTED_FOLLOWERS_MATCH' as const) : ('NOT_CHECKED' as const), followerListId: requireFollowers ? followerList?.id ?? null : null };
    return api<Draw>(`giveaways/${giveaway!.id}/draw`, { filters, winnerCount: count, reserveCount: 0, public: isPublic, idempotencyKey: crypto.randomUUID() });
  }

  function reset() {
    setUrl(''); setMedia(null); setSourceId(''); setPage(0); setLoaded(0); setComplete(false);
    setRequireFollowers(false); setShowFollowerImport(false); setFollowerList(null); setRequiredKeyword('');
    setGiveaway(null); setError('');
  }

  return <>
    <div className="page-heading"><h1>G‘olibni aniqlash</h1><p>Instagram post havolasini kiriting, kommentlarni yuklang va bitta bosishda g‘olibni tanlang.</p></div>

    {!integrations.loading && !connected && <div className="notice stack" style={{ marginBottom: 22 }}>
      <p>Boshlash uchun avval Instagram hisobingizni ulang.</p>
      <Button asChild style={{ width: 'fit-content' }}><Link href="/dashboard/integrations"><Instagram size={17} />Instagram hisobini ulash</Link></Button>
    </div>}

    {giveaway ? <div className="stack">
      <WinnerReveal title={giveaway.name} draw={null} onDraw={draw} duration={settings.data?.animationDuration ?? 4} />
      <Button variant="ghost" onClick={reset}><RotateCcw size={16} />Yangi tanlovni boshlash</Button>
    </div> : <div className="stack">
      <div className="panel stack">
        <h2 className="row"><Instagram size={18} />Post havolasi</h2>
        <label>Instagram post yoki Reel havolasi<input type="url" value={url} placeholder="https://instagram.com/reel/..." onChange={e => { setUrl(e.target.value); setComplete(false); setMedia(null); }} disabled={!!busy || !connected} /></label>
        <div className="row"><Button disabled={!!busy || !url.trim() || !connected} onClick={resolve}>{busy === 'resolve' ? <Busy /> : <Instagram size={17} />}Postni yuklash</Button></div>
        {media && <div className="notice stack">
          <div className="media-card">
            {(media.thumbnail_url || media.media_url) && <Image unoptimized width={90} height={110} className="media-thumb" alt="Instagram post" src={media.thumbnail_url || media.media_url || ''} referrerPolicy="no-referrer" />}
            <div><h3>@{media.username ?? 'Instagram'} · {media.media_type}</h3><p>{media.caption?.slice(0, 220) || 'Izohsiz post'}</p><small>{media.comments_count ?? '—'} ta komment</small></div>
          </div>
          <Button variant="secondary" disabled={!!busy || complete} onClick={loadComments}>{busy === 'comments' ? <Busy /> : complete ? <CheckCircle2 size={17} /> : <Download size={17} />} {complete ? 'Kommentlar yuklandi' : page ? 'Yuklashni davom ettirish' : 'Kommentlarni yuklash'}</Button>
          <p role="status" aria-live="polite">{loaded.toLocaleString()} ta komment yuklandi{complete ? '' : '...'}</p>
          {busy === 'comments' && <div className="progress-track"><div /></div>}
        </div>}
      </div>

      {complete && <div className="panel stack">
        <h2>Shartlar (ixtiyoriy)</h2>
        <label>Kommentda quyidagi so‘z bo‘lishi shart<input value={requiredKeyword} onChange={e => setRequiredKeyword(e.target.value)} placeholder="Masalan: BESH BOLA" maxLength={200} /></label>
        <label className="check-label"><input type="checkbox" checked={requireFollowers} onChange={e => { setRequireFollowers(e.target.checked); if (e.target.checked && !followerList) setShowFollowerImport(true); }} />Faqat obunachilar orasidan tanlash</label>
        {requireFollowers && <div className="section-line stack">
          {followerList ? <p className="row"><Users size={16} />Yuklangan ro‘yxat: <b>{followerList.name}</b> · {followerList.valid_rows.toLocaleString()} ta</p> : <p className="muted" style={{ fontSize: 14 }}>Instagram rasmiy API’si to‘liq obunachilar ro‘yxatini bermaydi — shuning uchun CSV/TXT ro‘yxatini o‘zingiz yuklang.</p>}
          <Button variant="secondary" onClick={() => setShowFollowerImport(!showFollowerImport)}>{followerList ? 'Boshqa ro‘yxat yuklash' : (showFollowerImport ? 'Yopish' : 'Obunachilar ro‘yxatini yuklash')}</Button>
          {showFollowerImport && <Importer fixedType="followers" onImported={list => { setFollowerList(list); setShowFollowerImport(false); }} />}
        </div>}
        <label style={{ maxWidth: 200 }}>G‘oliblar soni<input type="number" min={1} max={100} value={count} onChange={e => setWinnerCount(Number(e.target.value))} /></label>
        <label className="check-label"><input type="checkbox" checked={isPublic} onChange={e => setPublic(e.target.checked)} />Ommaviy tekshiruv havolasini yaratish</label>
        <ErrorBox message={error} />
        <div><Button disabled={!!busy || (requireFollowers && !followerList)} onClick={startDraw}>{busy === 'start' ? <Busy /> : <Instagram size={17} />}G‘olibni aniqlashga o‘tish</Button></div>
      </div>}
      <ErrorBox message={error || integrations.error} />
    </div>}
  </>;
}
