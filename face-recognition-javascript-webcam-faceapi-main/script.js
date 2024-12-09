const video = document.getElementById("video");
const wrapper = 
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

async function fetchUserDetails() {
  try {
    const response = await fetch("http://localhost:4000/getAllusers");
    const data = await response.json();
    return data.users;
  } catch (error) {
    console.error("Error fetching user details:", error);
  }
}

async function getLabeledFaceDescriptions() {
  const users = await fetchUserDetails();
  return Promise.all(
    users.map(async (user) => {
      const imgUrl = user.photo;
      const img = await faceapi.fetchImage(imgUrl);
      const detections = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

      return new faceapi.LabeledFaceDescriptors(user.email, [detections.descriptor]);
    })
  );
}

const showPopup = (message) => {
  if(message.msg==="insufficent balance")
    alert("insufficient balance")
  const msg = `email : ${message.user.email} <br>${message.user.fullname} <br>Amount : ${message.transact.amount}<br> source: ${message.transact.source} <br>destination: ${message.transact.destination} `
  document.body.classList.add('active')
  const p = document.getElementById("info")
  p.innerHTML = msg
  setTimeout(function() {
    document.body.classList.remove('active');
  }, 4000);
};

video.addEventListener("play", async () => {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  const detectedEmails = new Set();

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      drawBox.draw(canvas);

      if (result.label !== "unknown" ) { 
        detectedEmails.add(result.label); 
        handleUserDetection(result.label); 
      }
    });
  }, 4000);
});

function getLocation() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const long = position.coords.longitude;
          resolve({ lat, long }); 
        },
        (error) => {
          reject(error); 
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by this browser."));
    }
  });
}

const handleUserDetection = async (email) => {
  try {
    const location = await getLocation(); 
    console.log(location); 

    const response = await fetch("http://localhost:4000/travel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        email, 
        lat: location.lat, 
        long: location.long 
      })
    });

    const data = await response.json();
    console.log(data); 
    showPopup(data); 
  } catch (error) {
    console.error("Error getting location:", error); 
  }
};