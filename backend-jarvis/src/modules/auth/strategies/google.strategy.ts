import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { type ConfigType } from '@nestjs/config';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google-oauth.config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(googleOauthConfig.KEY)
    private googleConfiguration: ConfigType<typeof googleOauthConfig>,
    private authService: AuthService,
  ) {
    super({
      // Credenciales de tu app en Google Cloud Console
      clientID: googleConfiguration.clientID!,
      clientSecret: googleConfiguration.clientSecret!,
      // URL a la que Google redirige después de que el usuario autoriza
      callbackURL: googleConfiguration.callbackURL!,
      // Error 2: passReqToCallback es requerido por los tipos
      passReqToCallback: false,
      // Qué información pedimos a Google del usuario
      // 'email' → su correo, 'profile' → nombre, foto, etc.
      scope: ['email', 'profile'],
    });
  }

  //   Este método lo ejecuta Passport automáticamente cuando Google
  //   redirige al callback con los datos del usuario ya autorizados.
  //   accessToken → token de Google para hacer requests a sus APIs (no lo usamos)
  //   refreshToken → para renovar el accessToken de Google (no lo usamos)
  //   profile → los datos del usuario que Google nos devuelve
  //   done → función que le dice a Passport "terminé, acá están los datos"
  async validate(
    accessToken: string, //son para servicios de google
    refreshToken: string, //son para servicios de google
    profile: Profile,
    done: VerifyCallback,
  ) {
    const { emails, name, photos, id } = profile;

    const email = emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email returned by Google'), false);
    }
    // Extraemos solo lo que nos interesa del perfil de Google
    // y lo formateamos igual que nuestro modelo de usuario
    const user = {
      email, // primer email (Google puede tener varios)
      firstName: name?.givenName ?? '', // nombre
      lastName: name?.familyName ?? '', // apellido
      avatar: photos?.[0]?.value ?? '', // foto de perfil ******************ojo***************
      provider: 'GOOGLE', // para saber que vino de Google
      userName: '', //vacio por que el servicio de google no lo proporciona
      userId: '',
      provider_account_id: id,
    };
    //Valida en el servicio de auth si existe el correo o hay que crear al user
    const validateUser = await this.authService.validateOAuthUser(user);

    if (!validateUser) return done(new Error('Ha ocurrido un error'), false);

    user.userName = validateUser.userName;
    user.userId = validateUser.id;
    user.firstName = validateUser.profile?.firstName || user.firstName;
    user.lastName = validateUser.profile?.lastName || user.lastName;

    // done(error, datos) — null significa que no hubo error
    // Este objeto 'user' va a quedar disponible en req.user en el controller
    return done(null, user);
  }
}
