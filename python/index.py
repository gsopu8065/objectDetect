import numpy as np
import cv2

camera = cv2.VideoCapture(0)
#frame = cv2.imread("./frame.png")

while True:
     (grabbed, frame) = camera.read()

     if not grabbed:
         break

     h, w = frame.shape[:2]
     newWidth = int(w * 40 / 100)
     newHeight = int(h * 40 / 100)
     frame = cv2.resize(frame, (newWidth, newHeight))
     clone = frame.copy()
     clone = cv2.cvtColor(clone, cv2.COLOR_BGR2GRAY)
     clone = cv2.GaussianBlur(clone, (3, 3), 0)
     clone = cv2.adaptiveThreshold(clone, 255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 51, 0)
     cnts = cv2.findContours(clone, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
     cnts = cnts[0]

     for c in cnts:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.04 * peri, True)
        if len(approx) == 5 :
            (x, y, w, h) = cv2.boundingRect(approx)
            ar = w / float(h)
            if ar <= 1.05:
                cv2.drawContours(frame, [c], -1, (0, 255, 0), 2)

     cv2.imshow("Frame", frame)
     key = cv2.waitKey(1) & 0xFF
     if key == ord("q"):
        break

camera.release()
cv2.waitKey(0)
cv2.destroyAllWindows()




# def findContours(clone):
#     cnts = cv2.findContours(clone, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
#     cnts = cnts[0]
#
#     for c in cnts:
#         peri = cv2.arcLength(c, True)
#         approx = cv2.approxPolyDP(c, 0.04 * peri, True)
#         if len(approx) == 5 :
#             (x, y, w, h) = cv2.boundingRect(approx)
#             ar = w / float(h)
#             if ar <= 1.05:
#                 cv2.drawContours(frame, [c], -1, (0, 255, 0), 2)
#     cv2.imshow("Frame", frame)

#cv2.imshow("Clone ", clone)
#findContours(clone)