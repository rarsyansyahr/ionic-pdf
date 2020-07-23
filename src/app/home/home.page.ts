import { FileOpener } from "@ionic-native/file-opener/ngx";
import { HttpClient } from "@angular/common/http";
import { Platform } from "@ionic/angular";
import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder } from "@angular/forms";
import {
  Plugins,
  CameraResultType,
  CameraSource,
  FilesystemDirectory,
} from "@capacitor/core";

const { Camera, FileSystem } = Plugins;

import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage implements OnInit {
  myForm: FormGroup;
  pdfObj = null;
  photoPreview = null;
  logoData = null;

  constructor(
    private fb: FormBuilder,
    private plt: Platform,
    private http: HttpClient,
    private opener: FileOpener
  ) {}

  ngOnInit() {
    this.myForm = this.fb.group({
      showLogo: true,
      from: "Simon",
      to: "Max",
      text: "TEXTX",
    });

    this.loadLocalAssetToBase64();
  }

  loadLocalAssetToBase64() {
    this.http
      .get("./assets/img/capasitor.png", { responseType: "blob" })
      .subscribe((res) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.logoData = reader.result;
        };

        reader.readAsDataURL(res);
      });
  }

  async takePicture() {
    const img = await Camera.getPhoto({
      quality: 70,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });

    console.log("image");

    this.photoPreview = `data:image/jpeg;base64,${img.base64String}`;
  }

  createPdf() {
    const formValue = this.myForm.value;
    const img = this.photoPreview
      ? { image: this.photoPreview, width: 300 }
      : {};

    let logo = {};
    if (formValue.showLogo) {
      logo = { image: this.logoData, width: 50 };
    }

    const docDefinition = {
      watermark: {
        text: "Arsyansyah",
        color: "blue",
        opacity: 0.2,
        bold: true,
      },
      content: {
        columns: [
          logo,
          {
            text: new Date().toTimeString(),
            alignment: "right",
          },
          {
            text: "REMINDER",
            style: "header",
          },
          {
            columns: [
              {
                width: "50%",
                text: "From",
                style: "subheader",
              },
              {
                width: "50%",
                text: "To",
                style: "subheader",
              },
            ],
          },
          {
            columns: [
              {
                width: "50%",
                text: formValue.from,
              },
              {
                widh: "50%",
                text: formValue.to,
              },
            ],
          },
          img,
          {
            text: formValue.text,
            margin: [0, 20, 0, 20],
          },
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            margin: [0, 15, 0, 0],
          },
          subHeader: {
            fontSize: 14,
            bold: true,
            margin: [0, 15, 0, 0],
          },
        },
      },
    };

    this.pdfObj = pdfMake.cretePdf(docDefinition);
    console.log(this.pdfObj);
  }

  downloadPdf() {
    if (this.plt.is("cordova")) {
      this.pdfObj.getBase64(async (data) => {
        try {
          let path = `pdf/myletter_${Date.now()}.pdf`;

          const result = await FileSystem.writeFile({
            path,
            data: data,
            directory: FilesystemDirectory.Documents,
            recursive: true,
          });

          this.opener.open(`${result.uri}`, "application/pdf");
        } catch (error) {
          console.error("Unable to write file", error);
        }
      });
    } else {
      this.pdfObj.download();
    }
  }
}
