let isImageTest = true

if(!isImageTest){
    document.getElementById('image1').style.display = 'none';
}

function onOpencvLoad(){
    if(isImageTest){
        imageTest()
    }
    else{
      try{
            videoSource()
        }
        catch(err) {
            document.getElementById("errorMsg").innerHTML = err.message;
        }
    }
}

let src, gray, contours,hierarchy,rectangleColor, ksize, M, anchor, cap, video, streaming = false;
function createAllVariables(){
    src = isImageTest?cv.imread(document.getElementById('image1')): new cv.Mat(video.height, video.width, cv.CV_8UC4);
    gray = new cv.Mat();
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    rectangleColor = new cv.Scalar(0,255, 0, 255);
    ksize = new cv.Size(5, 5);
    M = cv.Mat.ones(5, 5, cv.CV_8U);
    anchor = new cv.Point(-1, -1);
}

function beforeContours(){
    if(!isImageTest){
        // step1: read source image
        cap.read(src);
    }
     //step2: convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    //step3: blur it to reduce noise
    cv.GaussianBlur(gray, gray, ksize, 0, 0, cv.BORDER_DEFAULT );

    //step4: canny operation
    cv.Canny(gray, gray, 75, 200);

    //step5: morph close to remove black dots in white lines
    cv.dilate(gray, gray, M, anchor, 1);
    cv.morphologyEx(gray, gray, cv.MORPH_CLOSE, M);
    //cv.erode(gray, gray, M, anchor, 1);
}

function findContours(){
    //step6: get contours
    cv.findContours(gray, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
}

/*
  step1: Check each contour is a quadrangle or not
  step2: Each contour should be at least with 150pixel with and 150pixel height
  step3: contour should be convexhull
*/
function filterContours(){
    let resCoun = [];
    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);

        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.01 * cv.arcLength(cnt, true), true);

        let rect = cv.boundingRect(cnt);

        if(approx.rows == 4 && rect.width >=150 && rect.height >=150 )
        {
            let temp = new cv.MatVector();
            temp.push_back(cnt);
            cv.drawContours(src, temp, 0, rectangleColor, 3, 8, hierarchy, 0);
            temp.delete();
        }
        approx.delete();
    }
}

function displayUpdatedImage(){
    cv.imshow('imageCanvas', src);
    cv.imshow('imageThres', gray);
}

function freeMemory(){
    src.delete();
    gray.delete();
    hierarchy.delete();
}

function imageTest(){

    if(isImageTest) {
        createAllVariables();

        beforeContours();

        findContours();

        filterContours();

        displayUpdatedImage();

        freeMemory();
    }
    else{
      console.error("To test with image, set the isImageTest flag to true")
    }
}

function videoSource() {
    streaming = true;
    video = document.getElementById('videoInput');
    createAllVariables();

    function processVideo() {
        try {

            if (!streaming) {
                freeMemory();
                return;
            }

            beforeContours();

            findContours();

            filterContours();

            displayUpdatedImage();

            // schedule the next one.
            let delay = 30 - (Date.now() - begin);
            setTimeout(processVideo, delay);
        } catch (err) {
            console.log(err);
        }
    }

    if (navigator.mediaDevices.getUserMedia) {
         navigator.mediaDevices.getUserMedia({video: { facingMode: { exact: "environment" } }})
        .then(function(stream) {
           video.srcObject = stream;
           cap = new cv.VideoCapture(video);
            // schedule the first one.
           setTimeout(processVideo, 0);
        })
        .catch(function(error) {
          console.error("To test with video, set the isImageTest flag to false")
          document.getElementById("errorMsg").innerHTML = error.message;
        });
    }
}

function stopVideo(){
    streaming = false;
}
