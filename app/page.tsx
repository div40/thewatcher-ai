"use client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { beep } from "@/utils/audio";
import {
  Camera,
  FlipHorizontal,
  PersonStanding,
  Video,
  Volume2,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Rings } from "react-loader-spinner";
import Webcam from "react-webcam";
import { toast } from "sonner";

import * as cocossd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { DetectedObject, ObjectDetection } from "@tensorflow-models/coco-ssd";
import { drawOnCanvas } from "@/utils/draw";
import { formatDate } from "@/utils/formatDate";
import Link from "next/link";

type Props = {};

let interval: any = null;
let stopTimeout: any = null;

const HomePage = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volume, setVolume] = useState(0.8);
  const [model, setModel] = useState<ObjectDetection>();
  const [loading, setLoading] = useState(false);

  //  media recorder initialization
  useEffect(() => {
    if (webcamRef && webcamRef.current) {
      const stream = (webcamRef.current.video as any).captureStream();

      if (stream) {
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const recordedBlob = new Blob([e.data], { type: "video" });

            const videoURL = URL.createObjectURL(recordedBlob);

            const a = document.createElement("a");
            a.href = videoURL;
            a.download = `${formatDate(new Date())}.webm`;
            a.click();
          }
        };

        mediaRecorderRef.current.onstart = (e) => {
          setIsRecording(true);
        };
        mediaRecorderRef.current.onstop = (e) => {
          setIsRecording(false);
        };
      }
    }
  }, [webcamRef]);

  useEffect(() => {
    setLoading(true);
    initModel();
  }, []);

  // load model
  async function initModel() {
    const loadedModel: ObjectDetection = await cocossd.load({
      base: "mobilenet_v2",
    });
    setModel(loadedModel);
  }

  useEffect(() => {
    if (model) {
      setLoading(false);
    }
  }, [model]);

  const runPrediction = async () => {
    if (
      model &&
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const predictions: DetectedObject[] = await model.detect(
        webcamRef.current.video
      );

      resizeCanvas(canvasRef, webcamRef);
      drawOnCanvas(mirrored, predictions, canvasRef.current?.getContext("2d"));

      // automatically start recording when a person is detected
      let personDetected: boolean = false;
      if (predictions.length > 0) {
        predictions.forEach((prediction) => {
          personDetected = prediction.class === "person";
        });

        if (personDetected && autoRecordEnabled) {
          startRecording(true);
        }
      }
    }
  };

  useEffect(() => {
    interval = setInterval(() => {
      runPrediction();
    }, 100);

    return () => clearInterval(interval);
  }, [webcamRef.current, model, mirrored, autoRecordEnabled, runPrediction]);

  const toggleTakeScreenshot = () => {
    if (!webcamRef.current) {
      toast("Camera not found! Please refresh.");
    } else {
      const imgSrc = webcamRef.current.getScreenshot();
      const blob = base64toBlob(imgSrc);
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${formatDate(new Date())}.png`;
      a.click();
    }
  };

  const toggleStartRecording = () => {
    if (!webcamRef.current) {
      toast("Camera not found! Please refresh.");
    }
    if (mediaRecorderRef.current?.state == "recording") {
      mediaRecorderRef.current.requestData();
      clearTimeout(stopTimeout);
      mediaRecorderRef.current.stop();
      toast("Recording saved to downloads");
    } else {
      startRecording(false);
    }
  };

  function startRecording(doBeep: boolean) {
    if (webcamRef.current && mediaRecorderRef.current?.state !== "recording") {
      mediaRecorderRef.current?.start();
      doBeep && beep(volume);

      stopTimeout = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        }
      }, 30000);
    }
  }

  const toggleAutoRecord = () => {
    if (autoRecordEnabled) {
      setAutoRecordEnabled(false);
      toast("Disabled Autorecord");
    } else {
      setAutoRecordEnabled(true);
      toast("Enabled Autorecord");
    }
  };
  return (
    <div className="flex h-screen">
      {/* webcam container */}
      <div className="relative">
        <div className="relative w-full h-screen">
          <Webcam
            ref={webcamRef}
            mirrored={mirrored}
            className="object-contain w-full h-full p-2"
          />
          {/* show detected objects using canvas */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 object-contain w-full h-full"
          ></canvas>
        </div>
      </div>
      {/* right container */}
      <div className="flex flex-row flex-1">
        <div className="flex flex-col justify-between max-w-xs gap-2 p-4 border-2 rounded-md shadow-md border-primary/5">
          <div className="flex flex-col gap-2">
            <ThemeToggle />
            <Button
              variant={"outline"}
              size="icon"
              onClick={() => {
                setMirrored((prev) => !prev);
              }}
            >
              <FlipHorizontal />
            </Button>
            <Separator className="my-2" />
          </div>
          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={toggleTakeScreenshot}
            >
              <Camera />
            </Button>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleStartRecording}
            >
              <Video />
            </Button>
            <Separator className="my-2" />
            <Button
              variant={autoRecordEnabled ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleAutoRecord}
            >
              {autoRecordEnabled ? (
                <Rings color="white" height={45} />
              ) : (
                <PersonStanding />
              )}
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} size={"icon"}>
                  <Volume2 />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Slider
                  max={1}
                  min={0}
                  step={0.2}
                  defaultValue={[volume]}
                  onValueCommit={(value) => {
                    setVolume(value[0]);
                    beep(value[0]);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex-1 h-full px-2 py-4 overflow-y-scroll">
          <FeatureDetails />
        </div>
      </div>
      {loading && (
        <div className="absolute z-50 flex items-center justify-center w-full h-full bg-primary-foreground">
          Getting everything ready . . . <Rings height={50} color="red" />
        </div>
      )}
    </div>
  );
};

function FeatureDetails() {
  return (
    <div className="text-xs text-muted-foreground">
      <ul className="space-y-4">
        <li className="mt-1">
          <strong>Dark Mode/ System Theme 🌗</strong>
          <p>Toggle between dark mode and system theme.</p>
        </li>
        <li>
          <strong>Mirror Camera ↔️</strong>
          <p>Adjust horizontal orientation.</p>
        </li>
        <Separator />
        <li>
          <strong>Take Pictures 📸</strong>
          <p>Capture snapshots at any moment from the video feed.</p>
        </li>
        <li>
          <strong>Manual Video Recording 📽️</strong>
          <p>Manually record video clips as needed.</p>
        </li>
        <Separator />
        <li>
          <strong>Enable/Disable Auto Record 🚫</strong>
          <p>Enable or disable automatic video recording whenever required.</p>
        </li>
        <li>
          <strong>Volume Slider 🔊</strong>
          <p>Adjust the volume level of the notifications.</p>
        </li>
        <li>
          <strong>Camera Feed Highlighting 🎨</strong>
          <p>
            Highlights persons in <span style={{ color: "#FF0F0F" }}>red</span>{" "}
            and other objects in <span style={{ color: "#00B612" }}>green</span>
            .
          </p>
        </li>
        <Separator />
      </ul>
    </div>
  );
}

export default HomePage;

// canvas height and width matches video
function resizeCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  webcamRef: React.RefObject<Webcam>
) {
  const canvas = canvasRef.current;
  const video = webcamRef.current?.video;

  if (canvas && video) {
    const { videoHeight, videoWidth } = video;
    canvas.height = videoHeight;
    canvas.width = videoWidth;
  }
}
