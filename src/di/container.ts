import { Container } from "inversify";
import { AuthService } from "../services/auth.service";

const container = new Container();
container.bind(AuthService).toSelf().inSingletonScope();

export default container;
