function basicImage(){
     let baseImage = cv.imread(document.getElementById('image1'));
     let dst = baseImage.clone();

     cv.cvtColor(baseImage, baseImage, cv.COLOR_RGBA2GRAY, 0);
     cv.threshold(baseImage, baseImage, 120, 200, cv.THRESH_BINARY);
     let contours = new cv.MatVector();
     let hierarchy = new cv.Mat();
     let rectangleColor = new cv.Scalar(255, 0, 0, 255);

     //cv.findContours(baseImage, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
     cv.findContours(baseImage, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

     for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);
        let rect = cv.boundingRect(cnt);
        //cv.drawContours(dst, contours, i, contoursColor, 1, 8, hierarchy, 100);
        let point1 = new cv.Point(rect.x, rect.y);
        let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
        cv.rectangle(dst, point1, point2, rectangleColor, 2, cv.LINE_AA, 0);
     }
     cv.imshow('imageCanvas', dst);
     baseImage.delete();
     contours.delete();
     hierarchy.delete();
}

function sortContours(contours){
    //additional step: sort contours
    let sortableContours = [];
    for (let i = 0; i < contours.size(); i++) {
      let cnt = contours.get(i);
      let area = cv.contourArea(cnt, true);
      sortableContours.push({ areaSize: area, contour: cnt });
    }

    //Sort 'em
    sortableContours = sortableContours.sort((item1, item2) => { return item2.areaSize - item1.areaSize });
    return sortableContours;
}

function getClosedContours(contours, hierarchy){

   let temp = new cv.MatVector();
    for( let i = 0; i< contours.size(); i=hierarchy.intAt(i, 0) ) // iterate through each contour.
    {
        if(hierarchy.intAt(i, 2)<0)
          temp.push_back(contours.get(i));
    }
    console.log("closed contours = "+temp.size())
    return temp;
}

let src, gray, contours,hierarchy,rectangleColor, ksize, M, anchor;
function creatAllVariables(){
    src = cv.imread(document.getElementById('image1'));
    gray = new cv.Mat();
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    rectangleColor = new cv.Scalar(0,255, 0, 255);
    ksize = new cv.Size(5, 5);
    M = cv.Mat.ones(5, 5, cv.CV_8U);
    anchor = new cv.Point(-1, -1);
}

function beforeContours(){
     //step2: convert to grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    //step3: blur it to reduce noise
    cv.GaussianBlur(gray, gray, ksize, 0, 0, cv.BORDER_DEFAULT );

    //step4: canny operation
    cv.Canny(gray, gray, 105, 200);

    //step5: morph close to remove black dots in white lines
    cv.dilate(gray, gray, M, anchor, 1);
    cv.morphologyEx(gray, gray, cv.MORPH_CLOSE, M);
    cv.erode(gray, gray, M, anchor, 1);
}

function findContours(){
    //step6: get contours
    cv.findContours(gray, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
}

/*
  step1: Check each contour is a quadrangle or not
  step2: Each contour should be at least with 30pixel with and 30pixel height
*/
function filterContours(){
    let resCoun = [];
    for (let i = 0; i < contours.size(); ++i) {
        let cnt = contours.get(i);

        let approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.03 * cv.arcLength(cnt, true), true);

        let rect = cv.boundingRect(cnt);
        if(approx.rows == 4 && rect.width >=30 && rect.height >=30)
        {
            let temp = new cv.MatVector();
            temp.push_back(cnt);
            cv.drawContours(src, temp, 0, rectangleColor, 3, 8, hierarchy, 0);
            temp.delete();
        }
        approx.delete();
    }
}

function imageTest(){

    creatAllVariables();

    beforeContours();

    findContours();

    filterContours();

    cv.imshow('imageCanvas', src);
    cv.imshow('imageThres', gray);

    src.delete();
    gray.delete();
    hierarchy.delete();
}

function videoSource() {
    streaming = true;
    video = document.getElementById('videoInput');
    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let gray = new cv.Mat();
    let approx = new cv.Mat();
    let begin = Date.now();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let rectangleColor = new cv.Scalar(0,255, 0, 255);
    let ksize = new cv.Size(5, 5);
    let M = cv.Mat.ones(5, 5, cv.CV_8U);
    let anchor = new cv.Point(-1, -1);

    function processVideo() {
        try {

            if (!streaming) {
                // clean and stop.
                src.delete();
                gray.delete();
                approx.delete();
                hierarchy.delete();
                return;
            }

            // step1: read source image
            cap.read(src);

            //step2: convert to grayscale
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

                //step3: blur it to reduce noise
            cv.GaussianBlur(gray, gray, ksize, 0, 0, cv.BORDER_DEFAULT );

            //step4: canny operation
            cv.Canny(gray, gray, 105, 200);

            //step4: apply threshold
            //cv.threshold(gray, gray, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);
            cv.dilate(gray, gray, M, anchor, 1);

            //step5: get contours
            cv.findContours(gray, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            //sort them
            let sortableContours = sortContours(contours);

            //step6: go through top 5 sorted contours
            for (let i = 0; i < sortableContours.length; ++i) {
                let cnt = sortableContours[i].contour;

                let approx = new cv.Mat();
                let perimeter = cv.arcLength(cnt, true);
                cv.approxPolyDP(cnt, approx, 0.03 * perimeter, true);

                //let rect = cv.boundingRect(cnt);
                //let aspectRatio = rect.width/rect.height
                if(approx.rows == 4) {
                    let temp = new cv.MatVector();
                    temp.push_back(cnt);
                    cv.drawContours(src, temp, 0, rectangleColor, 3, 8, hierarchy, 0);
                    //cv2.rectangle(image, (x, y), (x + w, y + h), (255, 0, 0), 2)
                    //streaming = false;
                    temp.delete();
                    //break;
                }
                approx.delete();
            }

            cv.imshow('imageCanvas', src);
            cv.imshow('imageThres', gray);


            // schedule the next one.
            let delay = 1000/FPS - (Date.now() - begin);
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
          console.log("Something went wrong!");
        });
    }
}
var cap, video, streaming = false;
const FPS = 30;
function stopVideo(){
    streaming = false;
}
