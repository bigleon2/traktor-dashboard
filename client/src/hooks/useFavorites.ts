/**
 * useFavorites — Hook de gestion des contrôles favoris
 * Design: Dark Studio Interface → tons crème, accents violet/vert
 * Persistance : localStorage (clé "traktor-midi-favorites")
 */
import { useState, useCallback } from "react";

const STORAGE_KEY = "traktor-midi-favorites";

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(set: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // silencieux si localStorage indisponible
  }
}

export function makeFavKey(categorie: string, nom: string): string {
  return `${categorie}||${nom}`;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites());

  const toggleFavorite = useCallback((categorie: string, nom: string) => {
    const key = makeFavKey(categorie, nom);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      saveFavorites(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (categorie: string, nom: string): boolean => {
      return favorites.has(makeFavKey(categorie, nom));
    },
    [favorites]
  );

  const favoriteCount = favorites.size;

  return { favorites, toggleFavorite, isFavorite, favoriteCount };
}
