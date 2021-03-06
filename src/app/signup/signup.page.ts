import { Component, OnInit } from '@angular/core';
import { User } from "../modals/user";

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { CustomService } from '../custom.service';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { DataService } from '../data.service';

@Component({
  selector: "app-signup",
  templateUrl: "./signup.page.html",
  styleUrls: ["./signup.page.scss"]
})
export class SignupPage implements OnInit {
  public user = {} as User
  public password
  public conf_password

  constructor(
    public platform: Platform,
    public fireauth: AngularFireAuth,
    public firestore: AngularFirestore,
    public router: Router,
    public parse: DataService,
    public custom: CustomService
  ) { }

  listener = (event) => {
    //something
    if (event.keyCode == 13) {
      this.check()
    }
  }

  ngOnInit() {
    if ("desktop" == this.platform.platforms()[0]) { // if the platform is desktop, so we have to add 'enter' key recognition
      document.body.addEventListener("keyup", this.listener)
      console.log("sign in page listener added")
    }
  }

  check() {
    if (!this.password || !this.user.email || !this.user.name) {
      this.custom.alert_dismiss("Input Fields are Empty", "Name, Email and Password have to be filled")
    } else {
      if (this.password != this.conf_password) {
        this.custom.alert_dismiss("Passwords are not Same", "Re-Check them")
      } else {
        this.user.email.toLowerCase()
        this.create()
      }
    }
  }

  async create(): Promise<any> {
    var setemail = this.user.email
    this.user.accept_sharing = true
    this.user.photoURL = `https://via.placeholder.com/75?text=${this.user.name.slice(0, 1).toUpperCase()}`
    var setpassword = this.password

    try {
      const result = await this.fireauth.auth
        .createUserWithEmailAndPassword(setemail, setpassword)
        .then(newUser => {
          this.firestore.collection("users").doc(newUser.user.uid).set(this.user);
        });
      this.custom.email = this.user.email
      this.custom.password = this.password

      this.custom.alert_dismiss(
        "Successfully Registered",
        "Add your Count Downs now.."
      );

      this.custom.alertCtrl.dismiss()

    } catch (e) {
      if (e.code == "auth/weak-password") {
        this.custom.alert_dismiss(
          "Weak Password",
          "Try a different password.<br>This password is <b>Weak</b>"
        )
      }
      else if (e.code == "auth/email-already-in-use") {
        this.custom.alert_dismiss(
          "Already Registered",
          "Log In instead of Sign Up"
        );
      } else {
        console.log(e.code)
      }
    }
  }

  login() {
    if (this.platform.platforms()[0] == "desktop") {
      document.body.removeEventListener("keyup", this.listener)
      console.log("sign up page Listener removed")
    }
    this.router.navigateByUrl('/login')
  }
}
