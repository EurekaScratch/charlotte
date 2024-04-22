import { loadHyren } from './hyren/dist/injector.mjs';

export default async function ({ addon }) {
    loadHyren(await addon.api.getVM());
}
