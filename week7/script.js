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
let currentStep = "start";
let planChecked = false;

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

  result.textContent = "오늘 그릴 대상: " + topic;
  result.textContent += "\n연습 시간: " + practiceTime.value + "분";
  result.textContent += "\n연습 메모: " + (memo.value.trim() || "입력하지 않음");
  result.textContent += "\n이메일: " + (email.value.trim() || "입력하지 않음");
  result.hidden = false;
  planChecked = true;
  confirmButton.textContent = "계획 확인 완료";
  confirmButton.disabled = true;
  completeButton.disabled = false;
  completeButton.textContent = "계획 준비 완료";
  showStep("review");
}

function updatePlan(event) {
  event.target.removeAttribute("aria-invalid");

  if (planChecked) {
    planChecked = false;
    confirmButton.disabled = false;
    confirmButton.textContent = "계획 다시 확인하기";
    result.hidden = true;
    result.textContent = "";
    showMessage("입력 내용이 바뀌었습니다. 계획을 다시 확인해 주세요.", "info");
  } else if (message.classList.contains("error")) {
    message.hidden = true;
  }
}

function resetPlan() {
  planChecked = false;
  confirmButton.disabled = false;
  confirmButton.textContent = "계획 확인하기";
  clearFeedback();
  result.hidden = true;
  result.textContent = "";
  completeResult.textContent = "";
  completeButton.disabled = false;
  completeButton.textContent = "계획 준비 완료";
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
  result.hidden = true;
  result.textContent = "";
  completeResult.textContent = "";
  confirmButton.disabled = false;
  confirmButton.textContent = "계획 다시 확인하기";
  showMessage("입력 내용이 유지되어 있습니다. 수정한 뒤 다시 확인해 주세요.", "info");
  showStep("input");
}

function completePlan() {
  if (currentStep !== "review" || !planChecked) {
    return;
  }
  completeResult.textContent = result.textContent;
  completeButton.disabled = true;
  completeButton.textContent = "완료됨";
  showStep("complete");
}

function backToReview() {
  completeButton.disabled = false;
  completeButton.textContent = "계획 준비 완료";
  showStep("review");
}

function restartFlow() {
  form.reset();
  clearFeedback();
  setActiveTab(tabs[0]);
  showStep("start");
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
