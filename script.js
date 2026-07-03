const messages = document.querySelector("#messages");
const quickReplies = document.querySelector("#quickReplies");
const contactForm = document.querySelector("#contactForm");
const closeChat = document.querySelector("#closeChat");
const openChat = document.querySelector("#openChat");
const chatbot = document.querySelector(".chatbot");
const pageContactForm = document.querySelector("#pageContactForm");
const pageFormMessage = document.querySelector("#pageFormMessage");

function trackEvent(name, detail = {}) {
  const events = JSON.parse(localStorage.getItem("koharu_demo_events") || "[]");
  events.push({
    name,
    detail,
    path: location.pathname,
    createdAt: new Date().toISOString()
  });
  localStorage.setItem("koharu_demo_events", JSON.stringify(events.slice(-200)));
}

trackEvent("page_view");

const flows = {
  price: {
    user: "料金を知りたい",
    bot: "料金は学年や通塾回数によって変わります。目安として、週1回は月額12,800円〜、週2回は月額22,800円〜です。無料相談で、お子さまに合う通い方をご案内できます。",
    cta: "無料相談で料金を確認する"
  },
  trial: {
    user: "無料体験について聞きたい",
    bot: "無料体験だけでも大丈夫です。体験後にすぐ入塾を決める必要はありません。当日は学習状況を確認し、必要な学習内容をご提案します。",
    cta: "無料体験を予約する"
  },
  worries: {
    user: "子どもの悩みを相談したい",
    bot: "今いちばん気になっていることを選んでください。悩みに合わせて、相談内容をご案内します。",
    nextButtons: [
      ["家で勉強しない", "何から始めればいいか分からない、前の単元でつまずいている、などが原因の場合があります。まずは学習状況を一緒に確認できます。"],
      ["苦手科目がそのまま", "苦手科目は、今の単元ではなく前の単元につまずきが残っている場合があります。つまずき診断で原因を確認できます。"],
      ["今からでも間に合うか不安", "まずは今の学力と目標を確認することが大切です。必要な単元まで戻って、優先順位をつけて進めます。"]
    ]
  },
  diagnosis: {
    user: "つまずき診断をしたい",
    bot: "無料体験では、学校の進度・テスト結果・苦手科目を確認し、どの単元まで戻ればよいかを一緒に整理します。診断だけのご相談でも大丈夫です。",
    cta: "つまずき診断を予約する"
  },
  schedule: {
    user: "曜日・時間を確認したい",
    bot: "部活や習い事後の時間もご相談いただけます。空き状況は時期によって変わるため、無料相談で希望曜日をお知らせください。",
    cta: "希望曜日を相談する"
  },
  contact: {
    user: "問い合わせたい",
    bot: "お問い合わせ内容を入力してください。教室より折り返しご連絡します。",
    form: true
  }
};

function addMessage(type, text) {
  const element = document.createElement("div");
  element.className = `message ${type}`;
  element.innerHTML = `<p>${text}</p>`;
  messages.appendChild(element);
  messages.scrollTop = messages.scrollHeight;
}

function showDefaultButtons() {
  quickReplies.classList.remove("is-compact");
  quickReplies.innerHTML = `
    <button data-flow="price">料金を知りたい</button>
    <button data-flow="trial">無料体験について聞きたい</button>
    <button data-flow="worries">子どもの悩みを相談したい</button>
    <button data-flow="diagnosis">つまずき診断をしたい</button>
    <button data-flow="schedule">曜日・時間を確認したい</button>
    <button data-flow="contact">問い合わせたい</button>
  `;
  contactForm.hidden = true;
}

function showCta(label) {
  quickReplies.classList.remove("is-compact");
  quickReplies.innerHTML = `
    <button class="primary" data-flow="contact">${label}</button>
    <button data-action="back">ほかの質問を見る</button>
  `;
}

function showWorryButtons(flow) {
  quickReplies.classList.remove("is-compact");
  quickReplies.innerHTML = "";
  flow.nextButtons.forEach(([label, reply]) => {
    const button = document.createElement("button");
    button.textContent = label;
    button.addEventListener("click", () => {
      addMessage("user", label);
      addMessage("bot", reply);
      trackEvent("chat_question_click", { label });
      showCta("今の悩みを無料相談する");
    });
    quickReplies.appendChild(button);
  });
  const back = document.createElement("button");
  back.textContent = "ほかの質問を見る";
  back.addEventListener("click", showDefaultButtons);
  quickReplies.appendChild(back);
}

quickReplies.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "back") {
    showDefaultButtons();
    return;
  }

  const flow = flows[button.dataset.flow];
  if (!flow) return;

  trackEvent("chat_question_click", { flow: button.dataset.flow, label: button.textContent.trim() });
  addMessage("user", flow.user);
  addMessage("bot", flow.bot);

  if (flow.form) {
    quickReplies.classList.add("is-compact");
    quickReplies.innerHTML = `<button data-action="back">ほかの質問を見る</button>`;
    contactForm.hidden = false;
    return;
  }

  if (flow.nextButtons) {
    showWorryButtons(flow);
    return;
  }

  showCta(flow.cta);
});

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  trackEvent("chat_contact_submit", Object.fromEntries(formData.entries()));
  addMessage("user", "問い合わせを送信する");
  addMessage("bot", "送信ありがとうございます。内容を確認のうえ、教室よりご連絡します。体験後に入塾をすぐ決める必要はありませんので、ご安心ください。");
  contactForm.reset();
  contactForm.hidden = true;
  showDefaultButtons();
});

closeChat.addEventListener("click", () => {
  chatbot.classList.add("is-closed");
  openChat.hidden = false;
});

openChat.addEventListener("click", () => {
  trackEvent("chat_open");
  chatbot.classList.remove("is-closed");
  openChat.hidden = true;
});

if (pageContactForm) {
  pageContactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(pageContactForm);
    trackEvent("page_contact_submit", Object.fromEntries(formData.entries()));
    pageContactForm.reset();
    pageFormMessage.textContent = "送信ありがとうございます。内容を確認のうえ、教室よりご連絡します。";
  });
}
