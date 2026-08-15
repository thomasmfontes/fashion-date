import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/", method = "GET", headers = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        accept: "text/html,application/json",
        ...headers,
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Fashion Date registration page (home)", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Fashion Date/i);
  assert.match(html, /Provador Fashion/i);
  assert.match(html, /name="name"/);
  assert.match(html, /name="store"/);
  assert.match(html, /name="phone"/);
  assert.match(html, /name="instagram"/);
  assert.match(html, /name="consent"/);
});

test("server-renders the Admin Login / Dashboard page", async () => {
  const response = await render("/admin");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Fashion Date/i);
  assert.match(html, /admin-boot|admin-login|painel/i);
});

test("server-renders the Live Draw telão page (/admin/sorteio)", async () => {
  const response = await render("/admin/sorteio");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Provador Fashion/i);
  assert.match(html, /Sorteio ao vivo/i);
});

test("server-renders the Success confirmation page (/sucesso)", async () => {
  const response = await render("/sucesso");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /participando/i);
  assert.match(html, /número da sorte/i);
});

test("server-renders the Duplicate registration page (/cadastro-duplicado)", async () => {
  const response = await render("/cadastro-duplicado");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /cadastro já foi realizado|já cadastrado|número/i);
});

test("server-renders the Photos page (/fotos)", async () => {
  const response = await render("/fotos");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Fashion Date|fotos|galeria/i);
});
