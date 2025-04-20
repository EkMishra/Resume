
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DataService } from '../../services/data.service'; // ✅ Import the service


@Component({
    selector: 'app-ai-interview',
    imports: [],
    templateUrl: './ai-interview.component.html',
    styleUrl: './ai-interview.component.css'
})
export class AiInterviewComponent {
    constructor(private http: HttpClient, public dataService: DataService) { }



    ngOnInit(): void {
        this.submitJobData(); // Call the function on component initialization
    }

    // summary: any = this.dataService.interview.analysis.summary; // Declare the property with a valid type or use 'any' if the type is unknown
    jp: any;

    submitJobData(): void {
        this.http.get('http://localhost:4000/api/calls').subscribe(
            (response: any) => {

                console.log("✅ Server response:", response || []);
                // console.log("✅ Server response:", response.structured_conversation || []);
                // console.log("✅ Server response:", response.structured_conversation.results.channels[0] || []);
                console.log("✅ Server response:", response.structured_conversation.results.channels[0].alternatives[0].transcript || []);
                this.dataService.job = response.structured_conversation.results.channels[0].alternatives[0].transcript;

                this.jp = this.dataService.job;
                this.finaleval(this.jp, this.dataService.summary); // Pass the job data to finaleval
                // const audioUrl = response;
            },
            (error: any) => {
                console.error("❌ Error submitting job data:", error);
            }
        );

    }

    finaleval(conversation: string, summary: string): void {
    
        const conversationArray = conversation.split('\n'); // Splits by each new line


        const jobData = {
            conversation: conversationArray, // Use transcript
            summary: summary
        };

        this.http.post('http://localhost:4000/api/finaleval', jobData).subscribe(
            (response: any) => {
                console.log("✅ Server response:", response);
            },
            (error: any) => {
                console.error("❌ Error submitting job data:", error);
            }
        );
    }



    // fetchAudio(): void {
    //   fetch('http://localhost:3000/api/audio')
    //     .then(response => response.blob())
    //     .then(blob => {
    //       const url = URL.createObjectURL(blob);
    //       const audio = document.getElementById('player') as HTMLAudioElement;
    //       audio.src = url;
    //     })
    //     .catch(error => {
    //       console.error("❌ Error fetching audio:", error);
    //     });
    // }

}
