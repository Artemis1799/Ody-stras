import { Component, signal, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App implements OnInit {
  protected readonly title = signal('Nidhoggr_front');
  async ngOnInit(): Promise<void> {
    try {
      if (typeof window === 'undefined') { return; }
      const L: any = (window as any).L;
      const center: [number, number] = [48.5846, 7.7507];
      const map = L.map('map', { center, zoom: 12 });
      const probe = async (template: string) => {
        try {
          const test = template.replace('{z}', '12').replace('{x}', '2048').replace('{y}', '1365');
          const r = await fetch(test, { method: 'HEAD' });
          return r.ok;
        } catch (err) {
          return false;
        }
      };
      const candidates = [
        '/assets/tiles/export/{z}/{x}/{y}.png',
        '/assets/tiles/export/{z}/{x}/{y}.jpg',
        '/assets/tiles/export/{z}/{x}/{y}.webp',
        'http://localhost:8080/data/tiles/{z}/{x}/{y}.png',
        'http://localhost:8080/tiles/{z}/{x}/{y}.png',
        'http://localhost:8080/{z}/{x}/{y}.png'
      ];
      const saved = localStorage.getItem('tileUrlTemplate');
      if (saved) candidates.unshift(saved);
      let chosen: string | null = null;
      for (const c of candidates) {
        if (!c) continue;
        if (await probe(c)) { chosen = c; break; }
      }
      if (!chosen) chosen = candidates[0];
      let tileLayer = L.tileLayer(chosen, { maxZoom: 20, attribution: '&copy; Local tiles' }).addTo(map);
      const input = document.getElementById('tileUrlInput') as HTMLInputElement | null;
      const btn = document.getElementById('tileTestBtn') as HTMLButtonElement | null;
      const status = document.getElementById('tileStatus') as HTMLElement | null;

      if (input) input.value = chosen || '';

      if (btn && input && status) {
        btn.addEventListener('click', async () => {
          const tpl = input.value.trim();
          if (!tpl) { status.textContent = 'Entrez un template d\'URL.'; return; }
          status.textContent = 'Test en cours...';
          const ok = await probe(tpl);
          if (ok) {
            try {
              if (typeof (tileLayer as any).setUrl === 'function') {
                (tileLayer as any).setUrl(tpl);
              } else {
                map.removeLayer(tileLayer);
                tileLayer = L.tileLayer(tpl, { maxZoom: 20, attribution: '&copy; Local tiles' }).addTo(map);
              }
              localStorage.setItem('tileUrlTemplate', tpl);
              status.textContent = 'Template appliqué et sauvegardé.';
            } catch (err) {
              status.textContent = 'Erreur lors de l\'application du template.';
            }
          } else {
            status.textContent = 'Le test a échoué (404 ou indisponible). Vérifiez l\'URL dans l\'interface du tile server.';
          }
        });
      }
    } catch (e) {
      console.error('Failed to initialize Leaflet map', e);
    }
  }
}
