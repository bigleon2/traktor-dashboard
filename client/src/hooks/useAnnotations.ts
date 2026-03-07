/**
 * useAnnotations — Hook de gestion des annotations Canal MIDI / Note-CC
 * Design: Dark Studio Interface → tons crème, accents violet/vert
 * Persistance : localStorage (clé "traktor-midi-annotations")
 */
import { useState, useCallback } from "react";

export interface Annotation {
  canal: string;      // ex: "Ch 1", "Ch 10"
  noteCC: string;     // ex: "CC 48", "Note 36"
  note: string;       // note libre de l'utilisateur
}

type AnnotationMap = Record<string, Annotation>; // clé = `${categorie}||${nom}`

const STORAGE_KEY = "traktor-midi-annotations";

function loadAnnotations(): AnnotationMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAnnotations(map: AnnotationMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // silencieux si localStorage indisponible
  }
}

export function makeKey(categorie: string, nom: string): string {
  return `${categorie}||${nom}`;
}

export function useAnnotations() {
  const [annotations, setAnnotations] = useState<AnnotationMap>(loadAnnotations);

  const setAnnotation = useCallback(
    (categorie: string, nom: string, data: Partial<Annotation>) => {
      setAnnotations((prev) => {
        const key = makeKey(categorie, nom);
        const existing = prev[key] ?? { canal: "", noteCC: "", note: "" };
        const updated = { ...prev, [key]: { ...existing, ...data } };
        // Supprimer si tout est vide
        if (!updated[key].canal && !updated[key].noteCC && !updated[key].note) {
          delete updated[key];
        }
        saveAnnotations(updated);
        return updated;
      });
    },
    []
  );

  const getAnnotation = useCallback(
    (categorie: string, nom: string): Annotation | null => {
      const key = makeKey(categorie, nom);
      return annotations[key] ?? null;
    },
    [annotations]
  );

  const clearAnnotation = useCallback((categorie: string, nom: string) => {
    setAnnotations((prev) => {
      const key = makeKey(categorie, nom);
      const updated = { ...prev };
      delete updated[key];
      saveAnnotations(updated);
      return updated;
    });
  }, []);

  const annotationCount = Object.keys(annotations).length;

  return { annotations, setAnnotation, getAnnotation, clearAnnotation, annotationCount };
}
