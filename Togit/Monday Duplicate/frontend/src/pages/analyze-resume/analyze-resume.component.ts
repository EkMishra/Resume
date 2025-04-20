// import { RouterModule, Router } from '@angular/router';
// import { Component } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { DataService } from '../../services/data.service'; // ✅ Import the service
// import { CommonModule } from '@angular/common';
// // import { Router } from '@angular/router';

// @Component({
//   selector: 'app-analyze-resume',
//   imports: [RouterModule, CommonModule],
//   templateUrl: './analyze-resume.component.html',
//   styleUrl: './analyze-resume.component.css'
// })

// export class AnalyzeResumeComponent {
//   constructor(private router: Router, private http: HttpClient, private dataService: DataService) { }
//   // constructor(private router: Router) {}

//   fullData: any;

//   redirectToAiInterview(): void {
//     this.fullData = this.dataService.interview;


//     const jobData = {
//       // summary: this.fullData.summary,
//       // name: this.fullData.name,
//       // job_role: this.fullData.role,
//       // phone_no: this.fullData.phone_no,
//       // questions: this.fullData.questions
//       summary: this.fullData.analysis.summary,
//       candidate_name: this.fullData.analysis.name,   // renamed from name
//       job_role: this.fullData.role,
//       phone_no: this.fullData.analysis.phone_no,
//       questions: this.fullData.analysis.questions
//     };

//     this.dataService.summary= jobData.summary; // Store the summary in the service

//     console.log("🚀 Redirecting to AI Interview with data: jd", jobData);

//     this.http.post('http://localhost:4000/api/interview', jobData).subscribe(
//       (response: any) => {
//         console.log("✅ Server response:", response);

//       },
//       (error: any) => {
//         console.error("❌ Error submitting job data:", error);
//       }
//     );



//     this.router.navigate(['/ai-interview']); // Replace with the correct route path
//   }

// }

import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-analyze-resume',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './analyze-resume.component.html',
  styleUrls: ['./analyze-resume.component.css']
})
export class AnalyzeResumeComponent implements OnInit {
  fullData: any = null;
  showInterviewSection: boolean = false;

  constructor(
    private router: Router,
    private http: HttpClient,
    private dataService: DataService
  ) { }

  ngOnInit(): void {

    const checkInterval = setInterval(() => {
      if (this.dataService.interview) {
        this.fullData = this.dataService.interview;
        this.showInterviewSection = true;
        clearInterval(checkInterval);
      }
    }, 500);

    this.fullData = this.dataService.interview;

    // Delay showing the interview section by 5 seconds
  }

  redirectToAiInterview(): void {
    if (!this.fullData || !this.fullData.analysis) {
      console.warn("⚠️ Data not available yet.");
      return;
    }

    const jobData = {
      summary: this.fullData.analysis.summary,
      candidate_name: this.fullData.analysis.name,
      job_role: this.fullData.role,
      phone_no: this.fullData.analysis.phone_no,
      questions: this.fullData.analysis.questions
    };

    this.dataService.summary = jobData.summary;

    console.log("🚀 Redirecting to AI Interview with data:", jobData);

    this.http.post('http://localhost:4000/api/interview', jobData).subscribe(
      (response: any) => {
        console.log("✅ Server response:", response);
        this.router.navigate(['/ai-interview']);
      },
      (error: any) => {
        console.error("❌ Error submitting job data:", error);
      }
    );
  }
}
