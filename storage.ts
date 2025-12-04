import { Poem } from "../types";

const STORAGE_KEY = 'poem_stream_data_v1';

export const getPoems = (): Poem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load poems", error);
    return [];
  }
};

export const savePoem = (poem: Poem): void => {
  try {
    const poems = getPoems();
    // Add new poem to the beginning
    const updatedPoems = [poem, ...poems];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPoems));
  } catch (error) {
    console.error("Failed to save poem", error);
  }
};

export const deletePoem = (id: string): Poem[] => {
  try {
    const poems = getPoems();
    const updatedPoems = poems.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPoems));
    return updatedPoems;
  } catch (error) {
    console.error("Failed to delete poem", error);
    return [];
  }
};

export const toggleLikePoem = (id: string): Poem[] => {
    try {
        const poems = getPoems();
        const updatedPoems = poems.map(p => {
            if (p.id === id) {
                // Determine if we are liking or unliking based on a local 'liked' state is tricky without auth.
                // For this MVP, we just increment. A real app would track user likes.
                return { ...p, likes: p.likes + 1 };
            }
            return p;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPoems));
        return updatedPoems;
    } catch (error) {
        console.error("Failed to like poem", error);
        return [];
    }
}
