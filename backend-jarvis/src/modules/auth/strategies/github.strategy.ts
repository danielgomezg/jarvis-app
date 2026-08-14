import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { type ConfigType } from '@nestjs/config';
import { Strategy, Profile } from 'passport-github2';
//import { VerifyCallback } from 'passport-oauth2';
import githubOAuthConfig from '../config/github-oauth.config';
import { AuthService } from '../auth.service';

//Definimos el tipo de la función done que Passport nos pasa al callback
type DoneCallback = (err: Error | null, user?: Express.User | false) => void;

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(githubOAuthConfig.KEY)
    private githubConfiguration: ConfigType<typeof githubOAuthConfig>,
    private authService: AuthService,
  ) {
    super({
      // Credenciales de tu app en GitHub
      clientID: githubConfiguration.clientID!,
      clientSecret: githubConfiguration.clientSecret!,
      // URL a la que GitHub redirige después de que el usuario autoriza
      callbackURL: githubConfiguration.callbackURL!,
      // Error 2: passReqToCallback es requerido por los tipos
      passReqToCallback: false,
      // Qué información pedimos a GitHub del usuario
      // 'email' → su correo, 'profile' → nombre, foto, etc.
      //scope: ['email', 'profile'],
      scope: ['user:email'],
    });
  }

  //   Este método lo ejecuta Passport automáticamente cuando GitHub
  //   redirige al callback con los datos del usuario ya autorizados.
  //   accessToken → token de GitHub para hacer requests a sus APIs (no lo usamos)
  //   refreshToken → para renovar el accessToken de GitHub (no lo usamos)
  //   profile → los datos del usuario que GitHub nos devuelve
  //   done → función que le dice a Passport "terminé, acá están los datos"
  async validate(
    accessToken: string, //son para servicios de github
    refreshToken: string, //son para servicios de github
    profile: Profile,
    done: DoneCallback,
  ) {
    const { emails, displayName, photos, username, id } = profile;

    const email = emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email returned by GitHub'), false);
    }
    // Extraemos solo lo que nos interesa del perfil de GitHub
    // y lo formateamos igual que nuestro modelo de usuario
    const user = {
      email: emails?.[0]?.value ?? '', // primer email (GitHub puede tener varios)
      firstName: displayName ?? '', // nombre
      lastName: displayName?.split(' ').slice(1).join(' ') ?? '', // apellido
      avatar: photos?.[0]?.value ?? '', // foto de perfil ******************ojo***************
      provider: 'GITHUB', // para saber que vino de GitHub
      userName: username ?? '', // nombre de usuario de GitHub
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
