/*
WEEK 6 WORKSHOP: POSE SIMON SAYS

FULL SKETCH — STUDENT IN-CLASS ACTIVITY

This is the base version of the project. It gives a prompt, watches for the
requested pose during the prompt, and then displays feedback.

YOUR TASK:
Change the confirmation and rejection feedback. You must change both:
1. the text shown for compliance and non-compliance; and
2. optionally, a visual property such as colour, shape, motion, or layout.

Changing the two message strings satisfies the coding task. Make them
easy to understand.

Examples:
- "GOOD HUMAN. COMPLIANCE RECORDED." versus "DEVIATION LOGGED."
- A green expanding circle versus a red shaking rectangle.
- A friendly message versus a bureaucratic machine message.

The working project must be published to GitHub Pages.
*/

// Webcam, pose model, and newest pose-estimation results.
let video;
let bodyPose;
let poses = [];
// Timestamp used to reject stale detections if the model stops updating.
let lastPoseTime = -10000;

// State-machine data controls which screen is shown and for how long.
let currentState = "WAITING";
let currentPrompt = null;
let stateStartTime = 0;

// Stays true after the requested gesture is first detected during a prompt.
let actionDetected = false;
let simonSays = false;
let actionAttempted = false;

const WAIT_TIME = 1500;
const PROMPT_TIME = 4000;
const RESULT_TIME = 2500;

const prompts = [
  { text: "Raise your left hand", action: "leftHandUp" },
  { text: "Raise your right hand", action: "rightHandUp" },
  { text: "Raise both hands", action: "bothHandsUp" }
];

function preload() {
  // Load MoveNet before setup() starts the camera and detection loop.
  bodyPose = ml5.bodyPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);

  // Capture camera frames, but hide the separate HTML video element.
  video = createCapture(VIDEO, { flipped: true });
  video.size(width, height);
  video.hide();

  // Run pose estimation continuously; gotPoses() stores each set of results.
  bodyPose.detectStart(video, gotPoses);

  // Start the first WAITING interval.
  stateStartTime = millis();
}

function gotPoses(results) {
  // Keep the latest detections and when they arrived.
  poses = results;
  lastPoseTime = millis();
}

function draw() {
  background(20);
  image(video, 0, 0);
  updateStateMachine();
  drawSkeleton();
  drawInterface();
}

function updateStateMachine() {
  // Use elapsed time instead of pauses so drawing and camera updates continue.
  let elapsed = millis() - stateStartTime;

  if (currentState === "WAITING") {
    // After a short pause, select the next instruction.
    if (elapsed > WAIT_TIME) {
      chooseNewPrompt();
      actionAttempted = false;
    }
  } else if (currentState === "PROMPTING") {
    // Keep the success flag once the requested gesture appears at any point.
   if (checkAction(currentPrompt.action)) {
  actionAttempted = true;

  if (simonSays) {
    actionDetected = true;
  }
}

    if (elapsed > PROMPT_TIME) {
      // Move to feedback when the action window ends.
      currentState = "RESULT";
      stateStartTime = millis();
    }
  } else if (currentState === "RESULT") {
    // Begin the next cycle after the result remains visible for its interval.
    if (elapsed > RESULT_TIME) {
      currentState = "WAITING";
      stateStartTime = millis();
    }
  }
}

function chooseNewPrompt() {
  // Select a random action.
  let index = floor(random(prompts.length));
  currentPrompt = prompts[index];

  // Randomly decide whether this round starts with "Simon says".
    simonSays = random() < 0.5;
  // Reset the previous result.
 // Reset the previous result.
actionDetected = false;
actionAttempted = false;
  currentState = "PROMPTING";
  stateStartTime = millis();
}


function leftHandUp() {
  // Return false unless there is a recent pose to inspect.
  let pose = getCurrentPose();
  if (!pose) return false;

  let wrist = pose.left_wrist;
  let shoulder = pose.left_shoulder;

  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;

  // Canvas y increases downward, so a raised wrist has a smaller y-coordinate.
  return wrist.y < shoulder.y;
}

function rightHandUp() {
  // Use the same wrist-versus-shoulder comparison on the right side.
  let pose = getCurrentPose();
  if (!pose) return false;

  let wrist = pose.right_wrist;
  let shoulder = pose.right_shoulder;

  if (!wrist || !shoulder) return false;
  if (wrist.confidence < 0.3 || shoulder.confidence < 0.3) return false;

  return wrist.y < shoulder.y;
}

function bothHandsUp() {
  // Both single-hand tests must pass for this combined action.
  return leftHandUp() && rightHandUp();
}

function checkAction(actionName) {
  // Route a prompt's action string to its matching gesture test.
  if (actionName === "leftHandUp") return leftHandUp();
  if (actionName === "rightHandUp") return rightHandUp();
  if (actionName === "bothHandsUp") return bothHandsUp();
  return false;
}

function getCurrentPose() {
  // Discard missing or stale results so an old pose cannot trigger success.
  if (poses.length === 0 || millis() - lastPoseTime > 700) return null;
  return poses[0];
}

function drawSkeleton() {
  // Skip rendering until a pose and camera frame dimensions are available.
  if (
    poses.length === 0 ||
    video.elt.videoWidth === 0 ||
    video.elt.videoHeight === 0
  ) return;

  let pose = poses[0];

  noStroke();
    fill(255, 77, 171);
  for (let keypoint of pose.keypoints) {
    // Suppress uncertain points so the overlay focuses on reliable detections.
    if (keypoint.confidence > 0.3) {
      circle(width - keypoint.x, keypoint.y, 16);
    }
  }

  stroke(0, 255, 180);
  strokeWeight(4);
  drawLimb(pose.left_shoulder, pose.left_elbow);
  drawLimb(pose.left_elbow, pose.left_wrist);
  drawLimb(pose.right_shoulder, pose.right_elbow);
  drawLimb(pose.right_elbow, pose.right_wrist);
  drawLimb(pose.left_shoulder, pose.right_shoulder);
  noStroke();
  // Connect torso to hips
drawLimb(pose.left_shoulder, pose.left_hip);
drawLimb(pose.right_shoulder, pose.right_hip);
drawLimb(pose.left_hip, pose.right_hip);

// Connect left leg
drawLimb(pose.left_hip, pose.left_knee);
drawLimb(pose.left_knee, pose.left_ankle);

// Connect right leg
drawLimb(pose.right_hip, pose.right_knee);
drawLimb(pose.right_knee, pose.right_ankle);
}

function drawLimb(pointA, pointB) {
  // Draw only when both ends of the segment have confident detections.
  if (!pointA || !pointB) return;
  if (pointA.confidence < 0.3 || pointB.confidence < 0.3) return;
  line(width - pointA.x, pointA.y, width - pointB.x, pointB.y);
}

function drawInterface() {
  noStroke();

  // Select the screen appropriate to the current state.
  if (currentState === "WAITING") {
    drawPanel("POSE SIMON SAYS", "Get ready. A prompt is coming.");
  } else if (currentState === "PROMPTING") {
    drawPanel("PROMPT", currentPrompt.text);
    drawTimer();
  } else if (currentState === "RESULT") {
    drawFeedback();
  }
}

function drawPanel(title, message) {
  // Shared panel for state titles, prompts, and short status messages.
  fill(0, 190);
  rect(20, 20, width - 40, 160, 14);

  fill(255);
  textAlign(CENTER, TOP);
  textSize(20);
  text(title, width / 2, 45);

  textSize(34);
  text(message, width / 2, 90);
}

function drawTimer() {
  // Convert remaining prompt time into a fraction for the circular progress arc.
  let elapsed = millis() - stateStartTime;
  let remaining = constrain(1 - elapsed / PROMPT_TIME, 0, 1);

  noFill();
  stroke(255);
  strokeWeight(8);
  arc(width / 2, 250, 90, 90, -HALF_PI, -HALF_PI + TWO_PI * remaining);
  noStroke();
}



function drawFeedback() {
  fill(0, 190);
  rect(20, 20, width - 40, 220, 14);

  textAlign(CENTER, TOP);

  if (simonSays && actionDetected) {
    fill(120, 255, 160);
    textSize(32);
    text("AWESOME! YOU DID IT!", width / 2, 60);

    fill(255);
    textSize(16);
    text("Correct Simon Says action!", width / 2, 140);

  } else if (simonSays && !actionDetected) {
    fill(255, 130, 130);
    textSize(30);
    text("NOT DETECTED!", width / 2, 60);

    fill(255);
    textSize(16);
    text("Try the action next round.", width / 2, 140);

  } else if (!simonSays && actionAttempted) {
    fill(255, 130, 130);
    textSize(28);
    text("OOPS! SIMON DIDN'T SAY!", width / 2, 60);

    fill(255);
    textSize(16);
    text("You did the action on an invalid prompt.", width / 2, 140);

  } else {
    fill(120, 255, 160);
    textSize(30);
    text("WELL DONE!", width / 2, 60);

    fill(255);
    textSize(16);
    text("You waited for Simon to say it.", width / 2, 140);
  }

  fill(255);
  textSize(16);

  let promptText = simonSays
    ? "Simon says: " + currentPrompt.text
    : currentPrompt.text;

  text("Prompt: " + promptText, width / 2, 190);
}
