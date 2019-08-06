import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { HttpClient} from '@angular/common/http';
import { ChangeDetectorRef } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

interface ServerResponse {
  [timestamp: string] : string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements AfterViewInit{
  
  // This will get the HTMLElement in app.component.html for the videos.
  // Look for #videoElement* in app.component.html
  @ViewChild('videoElement1', {static: false}) video1: any;
  @ViewChild('videoElement2', {static: false}) video2: any;
  @ViewChild('videoElement3', {static: false}) video3: any;
  @ViewChild('videoElement4', {static: false}) video4: any;

  // Interval at which we call the backend to get results
  fetch_interval_ms = 2000;
  // Boolean that can make the entire screen flash red when a shooter is there
  alarmOn = false; 
  // Camera id of the active camera in which the shooter last was
  activeCamera = "";
  // Camera id to HTMLVideoElement
  cameraMap = {};
  // Camera id to icon map
  cameraIconMap = {};
  // Camera id to stream url map
  cameraStreamMap = {};

  // Constructor injects http to communicate with backend
  // ChangeDetectorRef is to avoid an issue in dev environment
  // DomSanitizer is to trust the urls. (May be a security issue)
  constructor(private http: HttpClient, private ref: ChangeDetectorRef, private sanitizer: DomSanitizer) {}

  // This function is called right after the view is initialized
  // At this point we are sure that video1, video2, video3 and video4 are initialized
  ngAfterViewInit(): void {
    this.cameraStreamMap = {
      "camera21" : this.sanitizer.bypassSecurityTrustResourceUrl("http://192.168.43.224:3000"), // TODO: replace with actual url
      "camera22" : this.sanitizer.bypassSecurityTrustResourceUrl("http://192.168.43.81:3000"), // TODO: replace with actual url
      "camera24" : this.sanitizer.bypassSecurityTrustResourceUrl("http://192.168.43.224:3000"), // TODO: replace with actual url
      "camera26" : this.sanitizer.bypassSecurityTrustResourceUrl("http://192.168.43.81:3000")  // TODO: replace with actual url
    };
    this.cameraIconMap = {
      "camera21" : "target1",
      "camera22" : "target2",
      "camera24" : "target3",
      "camera26" : "target4",
    };
    this.cameraMap = {
      "camera21": this.video1,
      "camera22": this.video2,
      "camera24": this.video3,
      "camera26": this.video4
    }
    this.setCameraDimensions();
    this.ref.detectChanges();
    // Gets the values from backend at every fetch_interval
    setInterval(()=> {
      this.getValues();
    }, this.fetch_interval_ms);
  }


  public setCameraDimensions(): void {
    setTimeout(()=> {
      let aspectRatio = 16.0 / 9.0;
      let width = 600;
      let height = width / aspectRatio;
      this.video1.nativeElement.width = width;
      this.video1.nativeElement.height = height;
      this.video2.nativeElement.width = width;
      this.video2.nativeElement.height = height;
      // this.video3.nativeElement.width = width;
      // this.video3.nativeElement.height = height;
      // this.video4.nativeElement.width = width;
      // this.video4.nativeElement.height = height;
    })
  }

  /**
   * Gets the values of which camera the shooter is in.
   */
  public getValues(): void {    
    this.http.get("http://192.168.43.71/api/values").subscribe((data: ServerResponse) => {
      // Make sure to remove all the alerting css in case the shooter is no longer in a certain area
      const keys = Object.keys(this.cameraMap);
      this.alarmOn = false;
      for (const key of keys) {
        if(this.cameraMap[key]) {
          this.cameraMap[key].nativeElement.classList.remove("red");
          document.getElementsByClassName(this.cameraIconMap[key])[0].classList.remove("target-active");
        }
      }
      if (data) {
        const max_delay_ms = 5000;
        // Last time gets the latest time received from the backend.
        let lastTime = Object.keys(data).reduce((a, b) => a > b ? a : b);
        // If the last time we get from the backend was more than a certain time ago, we don't alert
        if (new Date().getTime() - new Date(lastTime).getTime() < max_delay_ms) {
          // Returns the name of the active camera. (Returns first one in case there are many)
          this.activeCamera = data[lastTime][0];
          // css class red will make the border of the video red
          this.cameraMap[this.activeCamera].nativeElement.classList.add("red");
          // css class target-active will make the camera flash on the mini-map
          document.getElementsByClassName(this.cameraIconMap[data[lastTime][0]])[0].classList.add("target-active");
        }
      } 
    });
  }
}
