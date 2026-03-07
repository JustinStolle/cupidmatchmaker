import { jack } from "@/characters/jack";
import { julie } from "@/characters/julie";

const characters = [julie, jack];

export function getCharacter(characterId: string) {
  return characters.find((character) => character.id === characterId) ?? null;
}

export function getAllCharacters() {
  return characters;
}