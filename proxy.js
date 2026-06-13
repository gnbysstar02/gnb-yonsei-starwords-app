// netlify/functions/proxy.js
// ─────────────────────────────────────────────────────────────
// 카카오톡·자녀보호 앱이 구글(script.google.com)을 막아도
// 학생 폰은 우리 사이트 주소(/api)로만 통신하게 해주는 중계(프록시) 함수.
// 학생폰 → (우리 netlify)/api → [이 함수가 대신] → 구글 GAS → 결과를 그대로 반환
// ─────────────────────────────────────────────────────────────

// ▼▼▼ 우리 학원 GAS 웹앱 주소 (필요 시 여기만 바꾸면 됩니다) ▼▼▼
const GAS_URL = "https://script.google.com/macros/s/AKfycbzs_IewGb07OHPgHkW5dCTNv5MeM0opOAdjNnbhLiZer4NU9UlSU09VkZBTO5AAFksWkQ/exec";
// ▲▲▲ 단어가 안 불러와지면, 단어장 HTML에 있던 주소로 교체해 보세요 ▲▲▲

exports.handler = async (event) => {
  try {
    // 1) 들어온 쿼리스트링(예: ?action=getWords&callback=cb)을 그대로 구글로 전달
    const qs = event.rawQuery ? "?" + event.rawQuery : "";
    const target = GAS_URL + qs;

    // 2) 요청 방식(GET/POST)에 맞춰 구글로 중계
    const init = { method: event.httpMethod || "GET", redirect: "follow" };
    if ((event.httpMethod || "GET").toUpperCase() === "POST") {
      // sendBeacon 등으로 들어온 본문을 그대로 전달 (단어 저장 등)
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body || "", "base64").toString("utf-8")
        : (event.body || "");
      init.headers = { "Content-Type": "text/plain;charset=utf-8" };
      init.body = raw;
    }

    // 3) 구글 호출 (script.google.com → googleusercontent 리다이렉트는 서버가 알아서 따라감)
    const res = await fetch(target, init);
    const body = await res.text();
    const ct = res.headers.get("content-type") || "application/javascript; charset=utf-8";

    // 4) 받은 내용을 학생 폰에 글자 그대로 돌려줌 (JSONP든 JSON이든 OK)
    return {
      statusCode: 200,
      headers: {
        "Content-Type": ct,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
      body,
    };
  } catch (e) {
    return {
      statusCode: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
      body: "proxy error: " + (e && e.message ? e.message : String(e)),
    };
  }
};
