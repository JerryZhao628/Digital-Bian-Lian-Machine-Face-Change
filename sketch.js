let video;
let poseNet;
let poses = [];

let currentMask = 0;
let lastSwitch = 0;

let waveCooldown = 800;
let useWaveTrigger = true;

function setup() {
  createCanvas(640, 480);

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();

  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on("pose", gotPoses);

  textFont("Arial");
}

function modelReady() {
  console.log("PoseNet ready");
}

function gotPoses(results) {
  poses = results;
}

function draw() {
  background(0);

  // mirror the webcam
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);
  pop();

  // semi-transparent overlay

  fill(0, 90);
  noStroke();
  rect(0, 0, width, height);

  if (poses.length > 0) {
    let pose = poses[0].pose;

    if (pose.nose && pose.leftEye && pose.rightEye) {
      let noseX = width - pose.nose.x;
      let noseY = pose.nose.y;

      let leftEyeX = width - pose.leftEye.x;
      let leftEyeY = pose.leftEye.y;
      let rightEyeX = width - pose.rightEye.x;
      let rightEyeY = pose.rightEye.y;

      let eyeDist = dist(leftEyeX, leftEyeY, rightEyeX, rightEyeY);
      let faceW = eyeDist * 2.8;
      let faceH = faceW * 1.25;

      let faceX = noseX;
      let faceY = noseY + 10;

      // trigger face change by waving
      if (useWaveTrigger && isWaving(pose)) {
        if (millis() - lastSwitch > waveCooldown) {
          currentMask = (currentMask + 1) % 4;
          lastSwitch = millis();
        }
      }

      drawMask(faceX, faceY, faceW, faceH, currentMask);

      fill(255, 50, 50);
      textSize(20);
      text("FACE DETECTED", 20, 30);

      fill(255);
      textSize(12);
      text("WAVE TO CHANGE FACE", 20, 50);
    }

  } else {
    fill(255, 50, 50);
    textSize(20);
    text("NO FACE DETECTED", 20, 30);

    fill(255);
    textSize(12);
    text("WAITING FOR HUMAN", 20, 50);
  }
}

function drawMask(x, y, w, h, type) {
  push();
  translate(x, y);
  noStroke();

  // red face
  if (type === 0) {
    fill(200, 30, 30, 220);
    ellipse(0, 0, w, h);

    fill(255);
    ellipse(-w * 0.18, -h * 0.12, w * 0.18, h * 0.12);
    ellipse(w * 0.18, -h * 0.12, w * 0.18, h * 0.12);

    fill(0);
    ellipse(-w * 0.18, -h * 0.12, w * 0.07, h * 0.07);
    ellipse(w * 0.18, -h * 0.12, w * 0.07, h * 0.07);

    fill(255);
    triangle(0, -h * 0.08, -w * 0.06, h * 0.12, w * 0.06, h * 0.12);

    fill(0);
    arc(0, h * 0.18, w * 0.28, h * 0.12, 0, PI);
  }

  // blue face
  if (type === 1) {
    fill(30, 80, 220, 220);
    ellipse(0, 0, w, h);

    fill(255);
    rectMode(CENTER);
    rect(0, 0, w * 0.08, h * 0.9, 10);
    rect(0, -h * 0.18, w * 0.6, h * 0.08, 10);

    ellipse(-w * 0.2, -h * 0.08, w * 0.16, h * 0.1);
    ellipse(w * 0.2, -h * 0.08, w * 0.16, h * 0.1);

    fill(0);
    ellipse(-w * 0.2, -h * 0.08, w * 0.05, h * 0.05);
    ellipse(w * 0.2, -h * 0.08, w * 0.05, h * 0.05);

    fill(255);
    arc(0, h * 0.18, w * 0.32, h * 0.14, 0, PI);
  }

  // black & white face
  if (type === 2) {
    fill(240, 230);
    ellipse(0, 0, w, h);

    fill(20);
    arc(-w * 0.12, 0, w * 0.75, h * 0.95, HALF_PI, PI + HALF_PI);

    fill(255);
    ellipse(-w * 0.17, -h * 0.1, w * 0.16, h * 0.1);
    fill(0);
    ellipse(-w * 0.17, -h * 0.1, w * 0.06, h * 0.06);

    fill(20);
    ellipse(w * 0.17, -h * 0.1, w * 0.16, h * 0.1);
    fill(255);
    ellipse(w * 0.17, -h * 0.1, w * 0.06, h * 0.06);

    fill(255, 0, 0);
    ellipse(0, h * 0.02, w * 0.08, h * 0.1);

    fill(20);
    rectMode(CENTER);
    rect(0, h * 0.22, w * 0.22, h * 0.06, 6);
  }

  // glitch face
  if (type === 3) {
    fill(20, 20, 20, 220);
    ellipse(0, 0, w, h);

    for (let i = 0; i < 12; i++) {
      fill(random(255), random(255), random(255), 180);
      rect(
        random(-w * 0.35, w * 0.35),
        random(-h * 0.35, h * 0.35),
        random(w * 0.1, w * 0.35),
        random(4, 16)
      );
    }

    fill(255);
    ellipse(-w * 0.18, -h * 0.08, w * 0.14, h * 0.08);
    ellipse(w * 0.18, -h * 0.08, w * 0.14, h * 0.08);

    fill(255, 0, 0);
    rectMode(CENTER);
    rect(0, h * 0.18, w * 0.22, h * 0.05);
  }

  pop();
}

//waving detection function
function isWaving(pose) {
  if (!pose.rightWrist || !pose.rightShoulder || !pose.rightElbow) {
    return false;
  }

  let wrist = pose.rightWrist;
  let shoulder = pose.rightShoulder;
  let elbow = pose.rightElbow;

  // hand above shoulder
  let handRaised = wrist.y < shoulder.y; 
  let armOpened = abs(wrist.x - elbow.x) > 25;

  return handRaised && armOpened;
}