import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient} from '@angular/common/http';

interface serverResponse {
  [timestamp: string] : string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements AfterViewInit{
  alarmOn = false;
  quadview = true;
  isFullscreen = false;
  lastDetectionTime = "";
  counter = 0;
  @ViewChild('videoElement', {static: false}) video: any;
  @ViewChild('videoElement1', {static: false}) video1: any;
  @ViewChild('videoElement2', {static: false}) video2: any;
  @ViewChild('videoElement3', {static: false}) video3: any;
  @ViewChild('videoElement4', {static: false}) video4: any;
  activeCamera = "";
  cameraMap = {};
  cameraIconMap = {};
  cameraStreamMap = {};
  startTime: Date;
  constructor(private http: HttpClient) {

  }

  ngAfterViewInit(): void {
    this.startTime = new Date();
    this.cameraStreamMap = {
      "camera21" : "http://192.168.43.224:3000",
      "camera22" : "http://localhost:8080/1",
      "camera24" : "http://localhost:8080/2",
      "camera26" : "http://localhost:8080/3",
    };
    this.cameraIconMap = {
      "camera21" : "target1",
      "camera22" : "target2",
      "camera24" : "target3",
      "camera26" : "target4",
    };
    if (this.quadview) {
      this.cameraMap = {
        "camera21": this.video1,
        "camera22": this.video2,
        "camera24": this.video3,
        "camera26": this.video4
      }
    }
    setInterval(()=> {
      this.getResponse();
    }, 1000);
    this.setCameras();
  }


  public setCameras(): void {
    setTimeout(()=> {
      let aspectRatio = 16.0 / 9.0;
      if (!this.quadview) {
        let width = 0;
        if (this.isFullscreen) {
          width = 1375;
        } else {
          width = 1100;
        }
        let height = width / aspectRatio;
        this.video.nativeElement.width = width;
        this.video.nativeElement.height = height;
      } else {
        let width = 0;
        if (this.isFullscreen) {
          width = 700;
        } else {
          width = 600;
        }
        let height = width / aspectRatio;
        this.video1.nativeElement.width = width;
        this.video1.nativeElement.height = height;
        this.video2.nativeElement.width = width;
        this.video2.nativeElement.height = height;
        this.video3.nativeElement.width = width;
        this.video3.nativeElement.height = height;
        this.video4.nativeElement.width = width;
        this.video4.nativeElement.height = height;
      }
    })
  }

  public switchView(): void {
    this.quadview = !this.quadview;
    setTimeout(() => {
      if (this.quadview) {
        this.cameraMap = {
          "camera21": this.video1,
          "camera22": this.video2,
          "camera24": this.video3,
          "camera26": this.video4
        }
      }
      this.setCameras();
    }, 0);
  }

  public fullscreen(): void {
    this.setCameras();
    this.isFullscreen = !this.isFullscreen;
    if(this.isFullscreen) {
      (document.getElementsByClassName("vidContainer")[0] as any).style.width = "100vw";
    } else {
      (document.getElementsByClassName("vidContainer")[0] as any).style.width = "69vw";
    }
  }

  public getCameraSrc(): string {
    return this.cameraStreamMap[this.activeCamera];
  }

  public getResponse(): any {    
    this.http.get("https://tsihotapi.azurewebsites.net/api/values").subscribe((data)=> {
      const keys = Object.keys(this.cameraMap)
      for (const key of keys) {
        this.cameraMap[key].nativeElement.classList.remove("red");
        document.getElementsByClassName(this.cameraIconMap[key])[0].classList.remove("target-active");
      }
      if (data) {
        // TODO : keep track of last time. If it is the same for 1 minute remove the active cam
        let lastTime = Object.keys(data).reduce((a, b) => a > b ? a : b);
        console.log(new Date().getTime() - new Date(lastTime).getTime());
        if (new Date().getTime() - new Date(lastTime).getTime() < 10000) {
          this.activeCamera = data[lastTime][0];
          this.cameraMap[this.activeCamera].nativeElement.classList.add("red");
          document.getElementsByClassName(this.cameraIconMap[data[lastTime][0]])[0].classList.add("target-active");
        } 
        // if (this.lastDetectionTime === lastTime) {
        //   this.counter++;
        // } else {
        //   this.lastDetectionTime = lastTime;
        //   this.counter == 0;
        // }

        // if(this.counter < 60 && ( new Date(this.lastDetectionTime) > this.startTime)) {
        //   this.alarmOn = true;
        //   this.activeCamera = data[lastTime][0];
        //   this.cameraMap[this.activeCamera].nativeElement.classList.add("red");
        //   document.getElementsByClassName(this.cameraIconMap[data[lastTime][0]])[0].classList.add("target-active");
        // } else {
        //   this.alarmOn = false;
        // }
      }
      return data;
    });
  }
}
