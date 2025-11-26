#!/usr/bin/env python3

import os
import math
import time
import requests

# --- CONFIG ---
ZOOM = 17
OUT_DIR = "tiles"
# Alternative tile servers (choisissez-en UN)
# Option 1: Tile servers alternatifs OSM (rotation a/b/c)
BASE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
# Option 2: Serveurs tiers gratuits (à utiliser avec modération)
# BASE_URL = "https://tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"  # OSM France
# BASE_URL = "https://tiles.wmflabs.org/osm/{z}/{x}/{y}.png"  # Wikimedia
SLEEP = 2.0  # Augmenté à 2 secondes pour être plus prudent
# BBOX Strasbourg + Illkirch
MINLAT = 48.5130
MINLON = 7.6350
MAXLAT = 48.6500
MAXLON = 7.8760

# MINLON = 7.6800 before
# MINLON = 7.6350 reel
# MAXLON = 7.8300 before
# MAXLON = 7.8760 reel

# User-Agent OBLIGATOIRE selon les conditions OSM
# Remplacez par vos vraies informations de contact
USER_AGENT = "TileDownloaderForMyStudentProjectICanGiveYouTheGitBtw/1.0 (ledesert675@gmail.com)"
# -------------

def deg2tile(lat, lon, zoom):
    """Convertit lat/lon en coordonnées de tuile x,y."""
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    xtile = int((lon + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.log(math.tan(lat_rad) + (1 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return xtile, ytile

def bbox_to_tiles(minlat, minlon, maxlat, maxlon, zoom):
    x1, y2 = deg2tile(minlat, minlon, zoom)
    x2, y1 = deg2tile(maxlat, maxlon, zoom)
    xmin, xmax = sorted((x1, x2))
    ymin, ymax = sorted((y1, y2))
    return xmin, xmax, ymin, ymax

def download_tile(z, x, y, outpath):
    os.makedirs(os.path.dirname(outpath), exist_ok=True)
    url = BASE_URL.format(z=z, x=x, y=y)
    
    # Si la tuile existe déjà, on ne la télécharge pas
    if os.path.exists(outpath):
        return True

    try:
        headers = {
            'User-Agent': USER_AGENT,
            'Referer': 'https://www.openstreetmap.org/'
        }
        r = requests.get(url, timeout=20, headers=headers)
        if r.status_code == 200:
            with open(outpath, "wb") as f:
                f.write(r.content)
            return True
        elif r.status_code == 429:
            print(f"RATE LIMIT atteint - pause de 60 secondes...")
            time.sleep(60)
            return False
        else:
            print(f"ERREUR {r.status_code}: {url}")
            return False
    except Exception as e:
        print(f"EXCEPTION {url}: {e}")
        return False

def main():
    xmin, xmax, ymin, ymax = bbox_to_tiles(MINLAT, MINLON, MAXLAT, MAXLON, ZOOM)
    total = (xmax - xmin + 1) * (ymax - ymin + 1)

    print(f"Tiles à télécharger: {total}")
    c = 0

    for x in range(xmin, xmax + 1):
        for y in range(ymin, ymax + 1):
            outpath = os.path.join(OUT_DIR, str(ZOOM), str(x), f"{y}.png")
            download_tile(ZOOM, x, y, outpath)
            c += 1
            
            if c % 50 == 0:
                print(f"{c}/{total} téléchargées...")
            
            time.sleep(SLEEP)

    print("Téléchargement terminé.")

if __name__ == "__main__":
    main()
