const form = document.getElementById("practice-form");
const subject = document.getElementById("subject");
const memo = document.getElementById("memo");
const email = document.getElementById("email");
const result = document.getElementById("practice-result");
const message = document.getElementById("form-message");
const confirmButton = document.getElementById("confirm-button");
const memoCount = document.getElementById("memo-count");
const practiceTime = document.getElementById("practice-time");
const timeGuide = document.getElementById("time-guide");
const tabs = document.querySelectorAll('[role="tab"]');
const practiceSection = document.getElementById("practice");
const flowPanels = document.querySelectorAll("[data-flow-step]");
const progressItems = document.querySelectorAll("[data-progress]");
const flowStatus = document.getElementById("flow-status");
const completeButton = document.getElementById("complete-button");
const completeResult = document.getElementById("complete-result");
const flowOrder = ["start", "input", "review", "complete"];
const stepNames = ["시작", "입력", "확인", "완료"];
const saveButton = document.getElementById("save-plan");
const saveMessage = document.getElementById("save-message");
const savedList = document.getElementById("saved-list");
const savedCardTemplate = document.getElementById("saved-card-template");
const savedEmpty = document.getElementById("saved-empty");
const savedCount = document.getElementById("saved-count");
const savedDetail = document.getElementById("saved-detail");
const savedResult = document.getElementById("saved-result");
const libraryMessage = document.getElementById("library-message");
const undoButton = document.getElementById("undo-remove");
const storageKey = "drawing-note-plans-v1";
let currentStep = "start";
let planChecked = false;
let currentPlan = null;
let savedPlans = [];
let selectedPlanId = null;
let lastRemoved = null;
let storageReady = true;
let loadedStorage = null;

function showMessage(text, state) {
  message.textContent = text;
  message.className = "feedback " + state;
  message.hidden = false;
}

function checkPlan(event) {
  event.preventDefault();
  if (currentStep !== "input") {
    return;
  }
  result.hidden = true;
  result.textContent = "";
  clearFeedback();

  const topic = subject.value.trim();
  if (topic === "") {
    showMessage("그릴 대상을 먼저 적어 주세요.", "error");
    subject.setAttribute("aria-invalid", "true");
    subject.focus();
    return;
  }

  if (!["10", "20", "30"].includes(practiceTime.value)) {
    showMessage("연습 시간을 선택해 주세요. 10분, 20분, 30분 중 고를 수 있습니다.", "error");
    practiceTime.setAttribute("aria-invalid", "true");
    practiceTime.focus();
    return;
  }

  if (!email.validity.valid) {
    showMessage("이메일 주소를 확인해 주세요. 예: drawing@example.com", "error");
    email.setAttribute("aria-invalid", "true");
    email.focus();
    return;
  }

  currentPlan = {
    subject: topic,
    minutes: practiceTime.value,
    memo: memo.value.trim(),
    email: email.value.trim()
  };
  result.textContent = formatPlan(currentPlan);
  result.hidden = false;
  planChecked = true;
  confirmButton.textContent = "계획 확인 완료";
  confirmButton.disabled = true;
  completeButton.disabled = false;
  completeButton.textContent = "계획 작성 완료";
  showStep("review");
}

function updatePlan(event) {
  event.target.removeAttribute("aria-invalid");

  if (message.classList.contains("error")) {
    message.hidden = true;
  }
}

function resetPlan() {
  planChecked = false;
  clearSaveState();
  confirmButton.disabled = false;
  confirmButton.textContent = "계획 확인하기";
  clearFeedback();
  result.hidden = true;
  result.textContent = "";
  completeResult.textContent = "";
  completeButton.disabled = false;
  completeButton.textContent = "계획 작성 완료";
  memoCount.textContent = "0 / 300자";
  memoCount.className = "field-help";
  showTimeGuide("");
  showMessage("입력 내용을 지웠습니다. 새 연습 계획을 적어 보세요.", "info");
  if (currentStep === "input") {
    subject.focus();
  }
}

function clearFeedback() {
  message.textContent = "";
  message.className = "feedback";
  message.hidden = true;
  subject.removeAttribute("aria-invalid");
  practiceTime.removeAttribute("aria-invalid");
  email.removeAttribute("aria-invalid");
}

function showStep(step) {
  const index = flowOrder.indexOf(step);
  if (index === -1) {
    return;
  }

  currentStep = step;
  practiceSection.dataset.step = step;
  flowPanels.forEach(function (panel) {
    panel.hidden = panel.dataset.flowStep !== step;
  });
  progressItems.forEach(function (item, itemIndex) {
    item.classList.toggle("done", itemIndex < index);
    if (itemIndex === index) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  });
  flowStatus.textContent = (index + 1) + " / 4단계 · " + stepNames[index];
  const activePanel = document.querySelector('[data-flow-step="' + step + '"]');
  activePanel.querySelector("h3").focus({ preventScroll: true });
  practiceSection.scrollIntoView({ block: "start" });
}

function startPlan() {
  showStep("input");
}

function backToStart() {
  clearFeedback();
  showStep("start");
}

function backToInput() {
  planChecked = false;
  clearSaveState();
  result.hidden = true;
  result.textContent = "";
  completeResult.textContent = "";
  confirmButton.disabled = false;
  confirmButton.textContent = "계획 다시 확인하기";
  showMessage("적어 둔 내용은 그대로입니다. 고친 뒤 다시 확인해 주세요.", "info");
  showStep("input");
}

function completePlan() {
  if (currentStep !== "review" || !planChecked) {
    return;
  }
  completeResult.textContent = result.textContent;
  completeButton.disabled = true;
  completeButton.textContent = "완료됨";
  updateSaveButton();
  showStep("complete");
}

function backToReview() {
  completeButton.disabled = false;
  completeButton.textContent = "계획 작성 완료";
  showStep("review");
}

function restartFlow() {
  form.reset();
  clearFeedback();
  setActiveTab(tabs[0]);
  selectedPlanId = null;
  renderSavedPlans();
  showStep("start");
}

function formatPlan(plan) {
  return "오늘 그릴 대상: " + plan.subject
    + "\n연습 시간: " + plan.minutes + "분"
    + "\n연습 메모: " + (plan.memo || "입력하지 않음")
    + "\n이메일: " + (plan.email || "입력하지 않음");
}

function samePlan(first, second) {
  return first.subject === second.subject && first.minutes === second.minutes
    && first.memo === second.memo && first.email === second.email;
}

function showLibraryMessage(text, state) {
  libraryMessage.textContent = text;
  libraryMessage.className = "feedback " + state;
  libraryMessage.hidden = false;
}

function showSaveMessage(text, state) {
  saveMessage.textContent = text;
  saveMessage.className = "feedback " + state;
  saveMessage.hidden = false;
}

function clearSaveState() {
  currentPlan = null;
  saveMessage.textContent = "";
  saveMessage.className = "feedback";
  saveMessage.hidden = true;
  updateSaveButton();
}

function updateSaveButton() {
  const alreadySaved = currentPlan && savedPlans.some(function (plan) {
    return samePlan(plan, currentPlan);
  });
  saveButton.disabled = !storageReady || Boolean(alreadySaved);
  saveButton.textContent = alreadySaved ? "목록에 보관됨" : "이 계획을 목록에 보관";
  if (!storageReady) {
    showSaveMessage("보관 목록을 읽지 못해 보관을 멈췄습니다. 저장 설정을 확인하고 목록 새로 불러오기를 눌러 주세요.", "error");
  } else if (alreadySaved) {
    showSaveMessage("같은 내용의 계획이 목록에 있습니다. 보관한 계획 보기에서 다시 열어 보세요.", "info");
  } else {
    saveMessage.textContent = "";
    saveMessage.hidden = true;
  }
}

function validSavedPlan(plan) {
  return plan && typeof plan.id === "string" && plan.id !== ""
    && typeof plan.subject === "string" && plan.subject.trim() !== "" && plan.subject.length <= 80
    && ["10", "20", "30"].includes(plan.minutes)
    && typeof plan.memo === "string" && plan.memo.length <= 300
    && typeof plan.email === "string" && plan.email.length <= 254;
}

function loadSavedPlans() {
  try {
    const stored = localStorage.getItem(storageKey);
    const plans = stored === null ? [] : JSON.parse(stored);
    if (!Array.isArray(plans)) {
      throw new Error("저장된 목록의 형식이 올바르지 않습니다.");
    }
    const planIds = [];
    for (const plan of plans) {
      if (!validSavedPlan(plan) || planIds.includes(plan.id)) {
        throw new Error("저장된 계획의 내용이나 번호를 확인해 주세요.");
      }
      planIds.push(plan.id);
    }
    loadedStorage = stored;
    storageReady = true;
    savedPlans = plans;
    savedEmpty.querySelector("p").textContent = "아직 보관한 계획이 없습니다. 연습 계획을 완료한 뒤 목록에 보관해 보세요.";
  } catch (error) {
    storageReady = false;
    savedEmpty.querySelector("p").textContent = "보관한 목록을 불러오지 못했습니다. 브라우저 저장 설정을 확인한 뒤 새로고침해 주세요.";
    showLibraryMessage("기존 데이터를 보호하기 위해 새 보관을 멈췄습니다. 작성·확인·완료 기능은 계속 이용할 수 있습니다.", "error");
  }
  renderSavedPlans();
  updateSaveButton();
}

function writeSavedPlans(plans) {
  if (!storageReady) {
    showLibraryMessage("보관 목록을 읽을 수 없습니다. 저장 설정을 확인하고 목록 새로 불러오기를 눌러 주세요.", "error");
    return false;
  }
  try {
    if (localStorage.getItem(storageKey) !== loadedStorage) {
      showLibraryMessage("다른 탭에서 목록이 바뀌었습니다. 목록 새로 불러오기를 누른 뒤 다시 시도해 주세요. 작성한 계획은 그대로 유지됩니다.", "error");
      return false;
    }
    const nextStorage = JSON.stringify(plans);
    localStorage.setItem(storageKey, nextStorage);
    loadedStorage = nextStorage;
    return true;
  } catch (error) {
    showLibraryMessage("목록을 저장하지 못했습니다. 브라우저의 저장 공간과 사이트 저장 권한을 확인한 뒤 다시 시도해 주세요.", "error");
    return false;
  }
}

function renderSavedPlans() {
  savedCount.textContent = "보관한 계획 " + savedPlans.length + "개";
  savedEmpty.hidden = savedPlans.length > 0;
  savedList.hidden = savedPlans.length === 0;
  savedList.replaceChildren();
  savedPlans.forEach(function (plan) {
    const item = savedCardTemplate.content.firstElementChild.cloneNode(true);
    item.classList.toggle("selected", plan.id === selectedPlanId);
    item.querySelector("h3").textContent = plan.subject;
    item.querySelector(".saved-time").textContent = "연습 시간 " + plan.minutes + "분";
    const open = item.querySelector('[data-action="open"]');
    open.dataset.id = plan.id;
    open.setAttribute("aria-label", plan.subject + " 계획 다시 열기");
    open.setAttribute("aria-expanded", plan.id === selectedPlanId);
    const remove = item.querySelector('[data-action="remove"]');
    remove.dataset.id = plan.id;
    remove.setAttribute("aria-label", plan.subject + " 계획 목록에서 빼기");
    remove.disabled = !storageReady;
    savedList.append(item);
  });

  const selectedPlan = savedPlans.find(function (plan) { return plan.id === selectedPlanId; });
  savedDetail.hidden = !selectedPlan;
  savedResult.textContent = selectedPlan ? formatPlan(selectedPlan) : "";
  undoButton.hidden = !lastRemoved;
}

function savePlan() {
  if (currentStep !== "complete" || !planChecked || !currentPlan || !storageReady) {
    return;
  }
  if (savedPlans.some(function (plan) { return samePlan(plan, currentPlan); })) {
    updateSaveButton();
    return;
  }
  const plan = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    subject: currentPlan.subject,
    minutes: currentPlan.minutes,
    memo: currentPlan.memo,
    email: currentPlan.email
  };
  const nextPlans = [plan].concat(savedPlans);
  if (!writeSavedPlans(nextPlans)) {
    showSaveMessage(libraryMessage.textContent, "error");
    return;
  }
  savedPlans = nextPlans;
  renderSavedPlans();
  updateSaveButton();
  showSaveMessage("보관했습니다. 보관한 계획 보기에서 다시 열어 보세요.", "success");
  showLibraryMessage("계획을 하나 보관했습니다. 다시 열기를 누르면 내용을 볼 수 있습니다.", "success");
}

function openSavedPlan(id) {
  if (!savedPlans.some(function (plan) { return plan.id === id; })) {
    showLibraryMessage("이 계획이 목록에 없습니다. 다른 계획을 선택해 주세요.", "info");
    return;
  }
  selectedPlanId = id;
  renderSavedPlans();
  savedDetail.querySelector("h3").focus({ preventScroll: true });
  savedDetail.scrollIntoView({ block: "nearest" });
}

function closeSavedPlan() {
  const previousId = selectedPlanId;
  selectedPlanId = null;
  renderSavedPlans();
  const openButton = Array.from(savedList.querySelectorAll('[data-action="open"]')).find(function (button) {
    return button.dataset.id === previousId;
  });
  if (openButton) {
    openButton.focus();
  }
}

function removeSavedPlan(id) {
  const index = savedPlans.findIndex(function (plan) { return plan.id === id; });
  if (index === -1) {
    return;
  }
  const plan = savedPlans[index];
  const followingPlan = savedPlans[index + 1];
  const nextPlans = savedPlans.filter(function (item) { return item.id !== id; });
  if (!writeSavedPlans(nextPlans)) {
    return;
  }
  savedPlans = nextPlans;
  lastRemoved = { plan: plan, followingId: followingPlan ? followingPlan.id : null };
  if (selectedPlanId === id) {
    selectedPlanId = null;
  }
  renderSavedPlans();
  updateSaveButton();
  showLibraryMessage("‘" + plan.subject + "’ 계획을 목록에서 뺐습니다. 되돌리기로 복구할 수 있습니다.", "info");
  undoButton.focus();
}

function undoRemove() {
  if (!lastRemoved) {
    return;
  }
  if (savedPlans.some(function (plan) { return samePlan(plan, lastRemoved.plan); })) {
    showLibraryMessage("같은 내용의 계획이 이미 목록에 있어 중복으로 되돌리지 않았습니다.", "info");
    lastRemoved = null;
    renderSavedPlans();
    document.getElementById("saved-title").focus();
    return;
  }
  const nextPlans = savedPlans.slice();
  const followingIndex = nextPlans.findIndex(function (plan) { return plan.id === lastRemoved.followingId; });
  nextPlans.splice(followingIndex === -1 ? nextPlans.length : followingIndex, 0, lastRemoved.plan);
  if (!writeSavedPlans(nextPlans)) {
    return;
  }
  savedPlans = nextPlans;
  lastRemoved = null;
  renderSavedPlans();
  updateSaveButton();
  showLibraryMessage("마지막으로 뺀 계획을 원래 자리에 되돌렸습니다.", "success");
  document.getElementById("saved-title").focus();
}

function handleSavedAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  if (button.dataset.action === "open") {
    openSavedPlan(button.dataset.id);
  } else if (button.dataset.action === "remove") {
    removeSavedPlan(button.dataset.id);
  }
}

function reloadSavedPlans() {
  selectedPlanId = null;
  loadSavedPlans();
  if (storageReady) {
    showLibraryMessage("목록을 다시 불러왔습니다. 작성 중인 계획은 유지되어 있습니다.", "info");
  }
}

function updateMemoCount() {
  const count = memo.value.length;
  memoCount.textContent = count + " / " + memo.maxLength + "자";
  memoCount.classList.toggle("has-text", count > 0);
  memoCount.classList.toggle("near-limit", count >= memo.maxLength - 30);
}

function showTimeGuide(minutes) {
  if (minutes === "") {
    timeGuide.textContent = "연습 시간을 선택하면 시간에 맞는 팁을 볼 수 있습니다.";
    timeGuide.className = "time-guide none";
    return;
  }
  let text = "큰 모양 위주로 가볍게 그려 보세요.";
  let style = "short";

  if (minutes === "20") {
    text = "큰 모양을 잡은 뒤 세부 모양을 더해 보세요.";
    style = "medium";
  } else if (minutes === "30") {
    text = "모양을 그리고 명암이나 색까지 더해 보세요.";
    style = "long";
  }

  timeGuide.textContent = minutes + "분 연습: " + text;
  timeGuide.className = "time-guide " + style;
}

function changePracticeTime(event) {
  showTimeGuide(practiceTime.value);
  updatePlan(event);
}

function selectTab(event) {
  setActiveTab(event.currentTarget);
}

function setActiveTab(selectedTab) {
  tabs.forEach(function (tab) {
    const selected = tab === selectedTab;
    tab.setAttribute("aria-selected", selected);
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
  });
}

function moveTab(event) {
  let index = Array.from(tabs).indexOf(event.currentTarget);

  if (event.key === "ArrowRight") {
    index = (index + 1) % tabs.length;
  } else if (event.key === "ArrowLeft") {
    index = (index + tabs.length - 1) % tabs.length;
  } else if (event.key === "Home") {
    index = 0;
  } else if (event.key === "End") {
    index = tabs.length - 1;
  } else {
    return;
  }

  event.preventDefault();
  tabs[index].focus();
  tabs[index].click();
}

form.addEventListener("submit", checkPlan);
form.addEventListener("input", updatePlan);
form.addEventListener("reset", resetPlan);
saveButton.addEventListener("click", savePlan);
savedList.addEventListener("click", handleSavedAction);
document.getElementById("close-saved").addEventListener("click", closeSavedPlan);
undoButton.addEventListener("click", undoRemove);
document.getElementById("reload-saved").addEventListener("click", reloadSavedPlans);
document.getElementById("start-button").addEventListener("click", startPlan);
document.getElementById("input-back").addEventListener("click", backToStart);
document.getElementById("review-back").addEventListener("click", backToInput);
completeButton.addEventListener("click", completePlan);
document.getElementById("complete-back").addEventListener("click", backToReview);
document.querySelectorAll('[id^="restart-"]').forEach(function (button) {
  button.addEventListener("click", restartFlow);
});
memo.addEventListener("input", updateMemoCount);
practiceTime.addEventListener("change", changePracticeTime);
tabs.forEach(function (tab) {
  tab.addEventListener("click", selectTab);
  tab.addEventListener("keydown", moveTab);
});
loadSavedPlans();
