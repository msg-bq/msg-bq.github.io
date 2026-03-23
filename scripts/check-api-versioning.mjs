import assert from "node:assert/strict";
import {
  getApiVersionOptions,
  getVersionOptions,
  isApiDocPath,
} from "../docs/.vitepress/versioning.mjs";

assert.equal(isApiDocPath("/usage/api"), true);
assert.equal(isApiDocPath("/en/usage/api"), true);
assert.equal(isApiDocPath("/api/v0.1/usage/api"), true);
assert.equal(isApiDocPath("/en/api/v0.1/usage/api"), true);
assert.equal(isApiDocPath("/usage/engine"), false);

const zhLatest = getApiVersionOptions("/usage/api");
assert.deepEqual(
  zhLatest.map((option) => ({
    key: option.key,
    active: option.active,
    href: option.href,
  })),
  [
    { key: "v0.2", active: true, href: "/usage/api" },
    { key: "v0.1", active: false, href: "/api/v0.1/usage/api" },
  ],
);

const enArchived = getApiVersionOptions("/en/api/v0.1/usage/api");
assert.deepEqual(
  enArchived.map((option) => ({
    key: option.key,
    active: option.active,
    href: option.href,
  })),
  [
    { key: "v0.2", active: false, href: "/en/usage/api" },
    { key: "v0.1", active: true, href: "/en/api/v0.1/usage/api" },
  ],
);

const nonApi = getApiVersionOptions("/usage/engine");
assert.deepEqual(nonApi, []);

assert.deepEqual(getVersionOptions("/usage/api"), []);

console.log("api versioning checks passed");
