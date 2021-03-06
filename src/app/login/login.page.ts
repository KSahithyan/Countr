import { Component, OnInit } from '@angular/core'
import { AngularFireAuth } from '@angular/fire/auth'
import { Router } from '@angular/router'
import { Storage } from '@ionic/storage'
import { CustomService } from '../custom.service'
import { AlertController, LoadingController, Platform } from '@ionic/angular'
import { LoadingService } from '../loading.service'
import { DataService } from '../data.service'
import { auth } from 'firebase'
import { AngularFirestore } from '@angular/fire/firestore';
import { User } from '../modals/user';
import { userInfo } from 'os';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  email
  password
  email_wrong = false

  constructor(
    public platform: Platform,
    public storage: Storage,
    public fireauth: AngularFireAuth,
    public firestore: AngularFirestore,
    public alertCtrl: AlertController,
    public loadCtrl: LoadingController,
    public router: Router,
    public loading: LoadingService,
    public custom: CustomService,
    public parse: DataService
  ) { }

  listener = (event) => {
    //something
    if (event.keyCode == 13) {
      this.login()
    }
  }

  ionViewWillEnter() {
    if ("desktop" == this.platform.platforms()[0]) { // If the platform is desktop, we have to add 'enter' key recognition
      document.body.addEventListener("keyup", this.listener)
      console.log("login page listener added")
    }
  }

  ngOnInit() {
    this.loading.dismiss()
    this.fireauth.auth.onAuthStateChanged(user => {
      // this.loading.present()
      console.log("auth:changed")

      if (user) {
        this.router.navigateByUrl('/home')
        console.log("auth:exists")
      } else {
        console.error("auth:notExists so home:notTriggered")
      }
    })

    this.fireauth.auth.getRedirectResult().then(user => {
      if (this.fireauth.auth.currentUser) {
        if (user.additionalUserInfo.isNewUser) {
          this.saveUserToFirebase(user, 'redirect')
        }
        this.custom.updateUser(user)
      }
    }).catch(e => {
      console.log(typeof e)
    })
  }

  async alert_password_reset(title, message) {
    const al = await this.alertCtrl.create({
      header: title,
      message: message,
      buttons: [{
        text: 'Try again',
        role: 'cancel'
      },
      {
        text: 'Change',
        handler: () => {
          this.forgot()
        }
      }]
    })
    al.present()
  }

  googleSignin() {
    let provider = new auth.GoogleAuthProvider()
    if (this.platform.is("cordova")) this.fireauth.auth.signInWithRedirect(provider)
    else this.fireauth.auth.signInWithPopup(provider).then(result => { this.saveUserToFirebase(result, 'pop') })
  }

  facebookSignin() {
    let provider = new auth.FacebookAuthProvider()
    if (this.platform.is("cordova")) this.fireauth.auth.signInWithRedirect(provider)
    else this.fireauth.auth.signInWithPopup(provider).then(result => { this.saveUserToFirebase(result, 'pop') })
  }

  login() {
    if (!this.email && !this.password) {
      this.custom.alert_dismiss("Input Fields are Empty", "Email and Password have to be filled")
    } else {
      this.loading.present()
      let load =
        this.fireauth.auth.signInWithEmailAndPassword(this.email, this.password)
          .then(data => {
            this.email = this.password = ""
            // this.router.navigateByUrl('/home')

          }).catch(e => {
            this.loading.dismiss()
            console.log(e)
            if (e.code == 'auth/invalid-email') {
              this.email_wrong = true
              this.custom.alert_dismiss('Invalid Email', 'Type your email fully..<br>(example: john@gmail.com)')
            }
            if (e.code == 'auth/wrong-password') {
              this.alert_password_reset('Password Is Wrong',
                "Check your password before trying again. <br> You can also change your password")
            }
            if (e.code == 'auth/user-not-found') {
              this.custom.alert_dismiss('Wrong Email Address', 'It seems like as you are not signed up yet<br> <b>Sign In before Log In again</b>')
            }
          });
    }

  }

  signup() {
    if (this.platform.platforms()[0] == "desktop") {
      document.body.removeEventListener("keyup", this.listener)
      console.log("log in page Listener removed")
    }
    this.router.navigateByUrl('/signup')
  }

  forgot() {
    if (!this.email_wrong) {
      this.fireauth.auth.sendPasswordResetEmail(this.email)
    } else {
      this.custom.alert_dismiss('Email Not Found', 'Enter your Email and Try again')
    }
  }

  saveUserToFirebase(creds: auth.UserCredential, from: String)  {
    console.log(creds)

    if ((from == 'pop' && creds.additionalUserInfo.isNewUser) || from == 'redirect') {
      this.firestore.collection("users").doc(creds.user.uid).set({
        name: creds.user.displayName,
        email: creds.user.email,
        photoURL: creds.user.photoURL,
        accept_sharing: true
      } as User)
    }
  }
}
