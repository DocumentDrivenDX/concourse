import { test, expect } from 'bun:test';
import { publicationProbes } from '../src/cli/check-publication.ts';
test('any named publication expands origins and deployed preview into asset probes', () => {
  const probes = publicationProbes({ version: 1, origins: ['https://one.example'], paths: ['/', '/search.json'] }, 'https://pr-12.any-site.pages.dev');
  expect(probes).toEqual(['https://one.example/', 'https://one.example/search.json', 'https://pr-12.any-site.pages.dev/', 'https://pr-12.any-site.pages.dev/search.json']);
});
test('probe configuration refuses empty policy paths and cross-origin paths', () => {
  for (const paths of [[], ['//evil.example'], ['/\\evil'], ['/../private']]) expect(() => publicationProbes({ version: 1, origins: ['https://one.example'], paths })).toThrow();
  expect(() => publicationProbes({ version: 1, origins: ['http://one.example'], paths: ['/'] })).toThrow();
});
