var CalculsDetailles = false;

class Operateur {
    static GetFromClasse(classe) {
        switch (classe) {
            case 'not': return OperateurNot; break;
            case 'egalstrict': return OperateurEgalStrict; break;
            case 'egalflou': return OperateurEgalFlou; break;
            case 'implique': return OperateurImplique; break;
        }
        return null;
    }
    constructor(arite, valeurs, nom, symbole) {
        this.Arite = arite;
        this.Valeurs = valeurs;
        this.Nom = nom;
        this.Symbole = symbole;
    }
    Calculer($explications, args) { // args peut être un tableau d'objets calculables ou bien un tableau de valeurs
        var resultat;
        var valeursArgs = [];
        if (args)
            for (var a of args) {
                if (a instanceof Object)
                    valeursArgs.push(a.Calculer($explications));
                else
                    valeursArgs.push(a);
            }
        switch (this.Arite) {
            case 0: resultat = this.Valeurs; break;
            case 1: resultat = this.Valeurs[valeursArgs[0]]; break;
            case 2: resultat = this.Valeurs[valeursArgs[0]][valeursArgs[1]]; break;
        }
        if ($explications && CalculsDetailles && this.Arite >= 0)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur les arguments ' + valeursArgs.map(function(v) {return libellesValeurs[v]}).join(',') + ' :' + libellesValeurs[resultat] + '<br>');
        return resultat;
    }
    ToString() {
        if (this.Arite == 0) return libellesValeurs[this.Valeurs];
        return this.Nom;
    }
    ToStringABC() { // Renvoie !A pour ou A => B
        switch (this.Arite) {
            case 0: return libellesValeurs[this.Valeurs];
            case 1: return this.Symbole + 'A';
            case 2: return 'A' + this.Symbole + 'B';
        }
        return '';
    }
}


function Complement(valeurs) {
    var output = [];
    for (var i=0; i<4; i++) if (!valeurs.includes(i)) output.push(i);
    return output;
}
function ArrayValeurToString(valeurs) {
    return '{' + valeurs.map(function(v) {return libellesValeurs[v]}).join(',') + '}';
}
class OperateurMultivaleur extends Operateur {
    constructor(ensembleValeurs) {
        super(0, [] , 'V+');
        this.EnsembleValeurs = ensembleValeurs;
    }
    Calculer($explications) {
        return this.EnsembleValeurs;
    }
    ToString() {
        return ArrayValeurToString(this.EnsembleValeurs);
    }
}

class OperateurNotMulti extends Operateur {
    constructor() {
        super(1, [] , 'Not');
    }
    Calculer($explications, args) {
        var resultat;
        var input = args[0].Calculer();
        var output = Complement(input);
        if ($explications && CalculsDetailles)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur ' + ArrayValeurToString(input) + ' : ' + ArrayValeurToString(output) +'<br>');
        return output;
    }
}

class OperateurDireveriteMulti extends Operateur {
    constructor() {
        super(2, [] , 'Direverite');
    }
    Calculer($explications, args) {
        var resultat;
        var input1 = args[0].Calculer();
        var input2 = args[1].Calculer();
        if (input1 instanceof Array) { // Branches !

        } else { // Pas branches !
            switch (input1) {
                case 0: resultat = Complement(input2); break;
                case 1: resultat = input2; break;
                case 2: resultat = []; break;
                case 3: resultat = [0, 1, 2, 3]; break;
            }
        }
        if ($explications && CalculsDetailles && this.Arite >= 0)
            $explications.append('Résultat de l\'opérateur ' + this.Nom + ' sur les arguments ' + input1 + ' et ' + ArrayValeurToString(input2) + ' : ' + ArrayValeurToString(resultat) + '<br>');
        return resultat;
    }
}



class Proposition {
    constructor(operateur, args) {
        this.Operateur = operateur;
        this.Arguments = args;
    }
    GetVariables() {
        var variables = [];
        for (var a of this.Arguments) {
            if (a instanceof Variable) variables.push(a);
            if (a instanceof Proposition) variables.push(...a.GetVariables()); // TODO : protection contre les boucles de récursion
        }
        return Uniquifier(variables);
    }
    TrouverVariablePropositionDansArguments() {
        if (this.Operateur.Arite == 2) {
            var variable, proposition;
            if (this.Arguments[0] instanceof Variable && this.Arguments[1] instanceof Proposition) {
                variable = this.Arguments[0];
                proposition = this.Arguments[1];
            }
            if (this.Arguments[1] instanceof Variable && this.Arguments[0] instanceof Proposition) {
                variable = this.Arguments[1];
                proposition = this.Arguments[0];
            }
            if (variable != undefined) return [variable, proposition];
        }
        return [null, null];
    }
    ChercherDependancesVariables() {
        var [variable, proposition] = this.TrouverVariablePropositionDansArguments();
        if (variable != null) {
            variable.Dependances.push(...proposition.GetVariables());
            proposition.ChercherDependancesVariables(); // TODO : protection contre les boucles de récursion
        }
    }
    EstDetermineePar(variables) {
        if (this.Operateur.Nom=='Egal strict') {
            var [variable, proposition] = this.TrouverVariablePropositionDansArguments();
            if (variable != null) {
                if (variables.includes(variable)) return false; // Cette proposition a pour variable d'affectation une des variables passées en paramètre, on considère qu'elle n'est pas déterminée par
                var variablesProposition = proposition.GetVariables();
                var determinee = true;
                for (var vp of variablesProposition)
                    if (!variables.includes(vp))
                        determinee = false;
                return determinee;
            }
        } else {
            // TODO : arrêter de ne savoir travailler qu'avec les égalités (à réfléchir)
        }
        return false;
    }
    Calculer($explications) {
        return this.Operateur.Calculer($explications, this.Arguments);
    }
    ToString() {
        var str = this.Operateur.ToString();
        if (this.Arguments.length > 0) {
            str += '(';
            str += this.Arguments.map(function(e) { return e.ToString(); }).join(', ');
            str += ')';
        }
        return str;
    }
}
class Variable {
    constructor(nom) {
        this.Nom = nom;
        this.Valeur = undefined;
    }
    Calculer() {
        return this.Valeur;
    }
    ToString() {
        return this.Nom;
    }
}

class Probleme {

    constructor(args) {
        this.Nom = args.Nom;
        this.Description = args.Description;
        this.Propositions = args.Propositions;
        this.Formule = args.Formule;
    }

    ToString() {
        return this.Propositions.map(function(p) {return p.ToString()}).join (' ; ');
    }

    GetVariables() {
        var variables = [];
        for (var p of this.Propositions) {
            variables.push(...p.GetVariables());
        }
        return Uniquifier(variables);
    }

    Resoudre() {
        var $solutions = this.$div.find('p.solutions');
        var $explications = this.$div.find('.explications .details');
        this.Solutions = [];
        $explications.html('');
        $('.tableverite tr.header').append('<th>' + this.Formule + '</th>');
        $explications.append('Début de la résolution du problème.<br>');
        $explications.append('Description du problème : ' + this.ToString() + '.<br>');
        $explications.append('Recherche des variables.<br>');
        this.Variables = this.GetVariables();
        $explications.append('Variables trouvées (' + this.Variables.length + ') : ' + this.Variables.map(function(v) {return v.Nom}).join(', ') + '<br>');
        this.InitialiserVariables();
        this.Variables[0].Valeur = -1; // Pour passer le premier while
        while(this.IncrementerVariable(0)) {
            $explications.append('Calcul des propositions avec les valuations suivantes : ' + this.Variables.map(function(v) {return v.Nom + '::' + libellesValeurs[v.Valeur];}).join(', ') + '<br>');
            var toutesvraies = true;
            for (var ip in this.Propositions) {
                var p = this.Propositions[ip];
                var vp = p.Calculer($explications);
                $explications.append('La proposition ' + ip + ' prend la valeur ' + libellesValeurs[vp] + '<br>');
                if (vp != 1) toutesvraies = false;
            }
            var selecteur = '';
            for (var iv in this.Variables) {
                var v = this.Variables[iv]
                selecteur += '[' + String.fromCharCode(97+parseInt(iv,10)) + '=' + v.Valeur + ']';
            }
            $('.tableverite tr' + selecteur).append('<td>' + libellesValeurs[toutesvraies ? 1 : 0] + '</td>');
            if (toutesvraies) {
                this.Solutions.push(this.Variables.map(function(v) {return v.Valeur}));
            }
        }
        $solutions.html('Solutions trouvées (' + this.Solutions.length + ') : <br>' + this.Solutions.map(function(s) {return s.map(function(v) {return libellesValeurs[v]}).join(',') }).join('<br>'));
    }
    InitialiserVariables() {
        for (var v of this.Variables) v.Valeur = 0;
    }
    IncrementerVariable(i) {
        var v = this.Variables[i];
        v.Valeur++;
        if (v.Valeur >= 4) {
            if (i >= this.Variables.length-1) return false; // Dernière valeur de la dernière variable
            v.Valeur = 0;
            return this.IncrementerVariable(i+1);
        } else {
            return true;
        }
    }
    ToHtml() {
        var html = '<div class="probleme">';
        html += '<h3 class="propositions">' + this.Formule + '</h3>';
        html += '<p class="enonce">' + this.Description + '</p>';
        html += '<p class="solutions"></p>';
        html += '<div class="explications"><h4>Voir les explications</h4><p class="details"></p></div>';
        html += '</div>';
        return html;
    }
    AppendHtmlTo($parent) {
        $parent.append(this.ToHtml());
        this.$div = $parent.children('div.probleme:last');

        // Masquer les explications par défaut et les rendre montrables
        this.$div.find('div.explications').each(function() {
            var $explications = $(this);
            $explications.find('.details').hide();
            $explications.find('h4').css('cursor', 'pointer').on('click', function() {
                $explications.find('.details').toggle();
            });
        });

    }
}

class ProblemeMultivalue extends Probleme {

    constructor(args) {
        super(args);
    }

    Resoudre() {
        var $solutions = this.$div.find('p.solutions');
        var $explications = this.$div.find('.explications .details');
        this.Solutions = [];
        $explications.html('');
        $explications.append('Début de la résolution du problème.<br>');
        $explications.append('Description du problème : ' + this.ToString() + '.<br>');
        $explications.append('Recherche des variables.<br>');
        this.Variables = this.GetVariables();
        $explications.append('Variables trouvées (' + this.Variables.length + ') : ' + this.Variables.map(function(v) {return v.Nom}).join(', ') + '<br>');

        $explications.append('Construction du graphe de dépendance des variables.<br>');
        for (var v of this.Variables) v.Dependances = [];
        for (var p of this.Propositions) {
            p.ChercherDependancesVariables();
        }
        this.VariablesLibres = []
        for (var v of this.Variables) {
            v.Dependances = Uniquifier(v.Dependances);
            $explications.append('La variable ' + v.Nom + ' est dépendante de : ' + v.Dependances.map(function(v) {return v.Nom}).join(', ') + '.<br>');
            if (v.Dependances.length == 0) this.VariablesLibres.push(v);
        }
        $explications.append('Variables libres trouvées (' + this.VariablesLibres.length + ') : ' + this.VariablesLibres.map(function(v) {return v.Nom}).join(', ') + '<br>');

        this.InitialiserVariables();
        this.VariablesLibres[0].Valeur = -1; // Pour passer le premier while
        while(this.IncrementerVariable(0)) {
            $explications.append('Calcul avec les valuations suivantes : ' + this.VariablesLibres.map(function(v) {return v.Nom + '::' + libellesValeurs[v.Valeur];}).join(', ') + '<br>');
            this.ResoudreEnForcant([], [], $explications, '');
        }
        $solutions.html('Solutions trouvées (' + this.Solutions.length + ') : <br>' + this.Solutions.map(function(s) {return s.map(function(v) {return libellesValeurs[v]}).join(',') }).join('<br>'));

    }

    ResoudreEnForcant(variablesForcees, valeursForcees, $explications, nomBranche) {

        // Chercher les propositions qui sont déterminées par les variables forcées
        for (var i in variablesForcees) variablesForcees[i].Valeur = valeursForcees[i];
        var variablesValorisees = [...this.VariablesLibres, ...variablesForcees];

        for (var ip in this.Propositions) {
            var p = this.Propositions[ip];
            if (p.EstDetermineePar(variablesValorisees)) {
                var [variableaffectation, sousproposition] = p.TrouverVariablePropositionDansArguments();
                var vals = sousproposition.Calculer($explications);
                if (nomBranche) {
                    $explications.append('Branche ' + nomBranche + ' ');
                    $explications.append('(' + variablesValorisees.map(function(v) {return v.Nom + '::' + libellesValeurs[v.Valeur];}).join(', ') + '). ');
                }
                $explications.append('Selon la proposition ' + ip + ', ' + variableaffectation.Nom + ' peut prendre les valeurs' + ArrayValeurToString(vals) + '.<br>');
                if (vals.length > 0) {
                    if (variablesValorisees.length == this.Variables.length-1) { // On a tout valorisé
                        for (var i in vals) {
                            var val = vals[i];
                            var solution = [];
                            for (var v of variablesValorisees) solution.push(v.Valeur);
                            solution.push(val);
                            $explications.append('Solution trouvée : ' + solution.map(function(v) {return libellesValeurs[v]}).join(',') + '<br>');
                            this.Solutions.push(solution);
                        }
                    } else {
                        $explications.append('Création de ' + vals.length + ' branches de calcul.<br>');
                        for (var i in vals) {
                            var val = vals[i];
                            this.ResoudreEnForcant([...variablesForcees, variableaffectation], [...valeursForcees, val], $explications, ((nomBranche != '') ? (nomBranche + '-') : '') + (parseInt(i,10) + 1).toString());
                        }
                    }
                }
            }
        }

    }

    InitialiserVariables() {
        for (var v of this.VariablesLibres) v.Valeur = 0;
    }
    IncrementerVariable(i) {
        var v = this.VariablesLibres[i];
        v.Valeur++;
        if (v.Valeur >= 4) {
            if (i >= this.VariablesLibres.length-1) return false; // Dernière valeur de la dernière variable
            v.Valeur = 0;
            return this.IncrementerVariable(i+1);
        } else {
            return true;
        }
    }

}

var Uniquifier = function(tableau) {
    return [...new Set(tableau)];
}


var JeuxLibellesValeurs = {
    'Thomas': ['0', '1', 'A', 'T'],
    'Norman': ['F', 'T', 'N', 'B'],
    'Ummo': ['AÏOOYEEDOO', 'AÏOOYAA', 'AÏOOYA AMMIÈ', 'AÏOOYAOU'],
    'Booléen': ['0^!1', '!0^1', '!0^!1', '0^1'],
};

var JeuxDefinitionsOperateurs = {
    'Thomas': {
        'Not':[1,0,2,3],
        'EgalStrict':[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
        'EgalFlou':[[1,0,2,3],[0,1,2,3],[2,2,1,0],[3,3,0,1]],
        'Implique':[[1,1,1,1],[0,1,2,3],[2,1,1,0],[3,1,0,1]],
    }
}

var V0 = new Operateur(0, 0);
var V1 = new Operateur(0, 1);
var V2 = new Operateur(0, 2);
var V3 = new Operateur(0, 3);
var OperateurNot = new Operateur(1, JeuxDefinitionsOperateurs.Thomas.Not, 'Not', '!');
var OperateurEgalStrict = new Operateur(2, JeuxDefinitionsOperateurs.Thomas.EgalStrict, 'Egal strict', '==');
var OperateurEgalFlou = new Operateur(2, JeuxDefinitionsOperateurs.Thomas.EgalFlou, 'Egal flou', '=');
var OperateurImplique = new Operateur(2, JeuxDefinitionsOperateurs.Thomas.Implique, 'Implique', '=>');


var libellesValeurs = JeuxLibellesValeurs['Thomas'];

var Problemes = [];
var p = new Variable('P');
var p1 = new Variable('P1');
var p2 = new Variable('P2');
var p3 = new Variable('P3');
var a = new Variable('A');
var b = new Variable('B');
var c = new Variable('C');
Problemes.push(new Probleme({
    Nom: 'Identité',
    Formule: 'P <span class="egalstrict"></span> P',
    Description: 'Problème de l\'identité, une proposition est-elle équivalente à elle-même',
    Propositions: [new Proposition(OperateurEgalStrict, [p,p])]
}));
Problemes.push(new Probleme({
    Nom: 'Double négation',
    Formule: 'P <span class="egalstrict"></span> <span class="not"></span> <span class="not"></span> P',
    Description: 'Problème de l\'identité après double négation',
    Propositions: [new Proposition(OperateurEgalStrict, [p,
        new Proposition(OperateurNot, [new Proposition(OperateurNot, [p])])
    ])]
}));
Problemes.push(new Probleme({
    Nom: 'Négation',
    Formule: 'P <span class="egalflou"></span> <span class="not"></span> P',
    Description: 'Problème de l\'identité après simple négation',
    Propositions: [new Proposition(OperateurEgalFlou, [p, new Proposition(OperateurNot, [p])])]
}));
Problemes.push(new Probleme({
    Nom: 'Egalité stricte',
    Formule: 'P1 <span class="egalstrict"></span> P2',
    Description: 'Problème de l\'identité stricte de deux propositions indépendantes (test trivial des problèmes à plusieurs variables',
    Propositions: [new Proposition(OperateurEgalStrict, [p1, p2])]
}));
Problemes.push(new Probleme({
    Nom: 'implication réflexive',
    Formule: 'P <span class="implique"></span> P',
    Description: 'Problème de la réflexivité de l\'opérateur implication',
    Propositions: [new Proposition(OperateurImplique, [p, p])]
}));
Problemes.push(new Probleme({
    Nom: 'Contraposition',
    Formule: '(A <span class="implique"></span> B) <span class="egalstrict"></span> (<span class="not"></span> B <span class="implique"></span> <span class="not"></span> A)',
    Description: 'Problème de la contraposition de deux variables indépendantes',
    Propositions: [new Proposition(OperateurEgalStrict, [
        new Proposition(OperateurImplique, [a, b]),
        new Proposition(OperateurImplique, [new Proposition(OperateurNot, [b]), new Proposition(OperateurNot, [a])]),
    ])]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 2',
    Formule: 'P1 <span class="egalflou"></span> </span> <span class="not"></span> P2 ; P2 <span class="egalflou"></span> </span> <span class="not"></span> P1',
    Description: 'Alice dit que Bob ment ; Bob dit que Alice ment',
    Propositions: [
        new Proposition(OperateurEgalFlou, [a, new Proposition(OperateurNot, [b])]),
        new Proposition(OperateurEgalFlou, [b, new Proposition(OperateurNot, [a])])
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 3',
    Formule: 'P1 <span class="egalflou"></span> </span> <span class="not"></span> P2 ; P2  <span class="egalflou"></span> </span> <span class="not"></span> P3 ; P3  <span class="egalflou"></span> </span> <span class="not"></span> P1',
    Description: 'Alice dit que Bob ment ; Bob dit que Clara ment ; Clara dit que Alice ment',
    Propositions: [
        new Proposition(OperateurEgalFlou, [a, new Proposition(OperateurNot, [b])]),
        new Proposition(OperateurEgalFlou, [b, new Proposition(OperateurNot, [c])]),
        new Proposition(OperateurEgalFlou, [c, new Proposition(OperateurNot, [a])])
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 3, variante',
    Formule: 'P1 <span class="egalstrict"></span> (P2 <span class="egalflou"></span> <span class="v0"></span>) ; P2 <span class="egalstrict"></span> (P3 <span class="egalflou"></span> <span class="v0"></span>) ; P3 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v2"></span>)',
    Description: 'Alice dit que Bob ment ; Bob dit que Clara ment ; Clara dit que Alice ne dit ni vrai ni faux',
    Propositions: [
        new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
        new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p3, V0])]),
        new Proposition(OperateurEgalStrict, [p3, new Proposition(OperateurEgalFlou, [p1, V2])]),
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 2 avec observateur',
    Formule: 'P1 <span class="egalstrict"></span> (P2 <span class="egalflou"></span> <span class="v0"></span>) ; P2 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v0"></span>) ; P3 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v2"></span>)',
    Description: 'Alice dit que Bob ment ; Bob dit que Alice ment ; Clara dit que Alice ne dit ni vrai ni faux',
    Propositions: [
        new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
        new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p1, V0])]),
        new Proposition(OperateurEgalStrict, [p3, new Proposition(OperateurEgalFlou, [p1, V2])]),
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 2, variante',
    Formule: 'P1 <span class="egalstrict"></span> (P2 <span class="egalflou"></span> <span class="v0"></span>) ; P2 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v1"></span>)',
    Description: 'Alice dit que Bob ment ; Bob dit que Alice dit vrai',
    Propositions: [
        new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
        new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p1, V1])])
    ]
}));
Problemes.push(new Probleme({
    Nom: 'Menteur à 2 avec observateur, variante',
    Formule: 'P1 <span class="egalstrict"></span> (P2 <span class="egalflou"></span> <span class="v0"></span>) ; P2 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v1"></span>) ; P3 <span class="egalstrict"></span> (P1 <span class="egalflou"></span> <span class="v2"></span>)',
    Description: 'Alice dit que Bob ment ; Bob dit que Alice dit vrai ; Clara dit que Alice ne dit ni vrai ni faux',
    Propositions: [
        new Proposition(OperateurEgalStrict, [p1, new Proposition(OperateurEgalFlou, [p2, V0])]),
        new Proposition(OperateurEgalStrict, [p2, new Proposition(OperateurEgalFlou, [p1, V1])]),
        new Proposition(OperateurEgalStrict, [p3, new Proposition(OperateurEgalFlou, [p1, V2])]),
    ]
}));

// Problème multivalué
var OperateurDireverite = new OperateurDireveriteMulti();
var Chat = new Variable('CHAT');
var Alice = new Variable('ALICE');
var Bob = new Variable('BOB');
Problemes.push(new ProblemeMultivalue({
    Nom: 'Chat multivalué',
    Formule: 'CHAT = DIREVERITE(ALICE, 1T) ; CHAT = DIREVERITE(ALICE, 0T) ; ALICE = DIREVERITE(BOB,  1)',
    Description: 'Alice dit que le chat est blanc. Alice dit que le chat est noir. Bob dit que Alice est strictement sincère.',
    Propositions: [
        new Proposition(OperateurEgalStrict, [Chat, new Proposition(OperateurDireverite, [Alice, new OperateurMultivaleur([1,3])])]),
        new Proposition(OperateurEgalStrict, [Chat, new Proposition(OperateurDireverite, [Alice, new OperateurMultivaleur([0,3])])]),
        new Proposition(OperateurEgalStrict, [Alice, new Proposition(OperateurDireverite, [Bob, new OperateurMultivaleur([1])])]),
    ]
}));

var AfficherLibellesValeurs = function() {
    for (var i=0; i<4; i++) {
        $('.definitions .valeurs [name=v' + i + ']').val(libellesValeurs[i]);
        $('.v' + i).html(libellesValeurs[i]);
    }
}

var AfficherLibellesOperateurs = function() {
    $('.definitions .operateurs [name=egalstrict]').val(OperateurEgalStrict.Symbole);
    $('.definitions .operateurs [name=egalflou]').val(OperateurEgalFlou.Symbole);
    $('.definitions .operateurs [name=not]').val(OperateurNot.Symbole);
    $('.definitions .operateurs [name=implique]').val(OperateurImplique.Symbole);
    $('span.egalstrict').html(OperateurEgalStrict.Symbole);
    $('span.egalflou').html(OperateurEgalFlou.Symbole);
    $('span.not').html(OperateurNot.Symbole);
    $('span.implique').html(OperateurImplique.Symbole);
}

var ResoudreProblemes = function() {
    ConstruireTableVerite(); // Chaque problème ajoutera sa colonne dans la table de vérité donc remettons là à 0
    for (var probleme of Problemes)
        probleme.Resoudre();
    AfficherLibellesOperateurs(); // Uniquement à cause des problèmes qui ont mis leur formule dans la table de vérite :(
}

var ConstruireTableVerite = function() { // Construire ou reconstruire la table de vérité dans la div prévue à cet effet
    $table = $('.tableverite').html('<table></table>').children();
    $table.append($trheader = $('<tr class="header"></tr>'));
    $trheader.append('<th>A</th><th>B</th><th>C</th>');
    var operateurs = [OperateurNot, OperateurEgalStrict, OperateurEgalFlou, OperateurImplique];
    for (var operateur of operateurs) $trheader.append('<th>' + operateur.ToStringABC() + '</th>')
    for (var c=0; c<4; c++) {
        for (var a=0; a<4; a++) {
            for (var b=0; b<4; b++) {
                $table.append($tr = $('<tr a="' + a + '" b="' + b + '" c="' + c + '"></tr>'));
                if (c==0 && a==3 && b==3) $tr.addClass('lastab');
                $tr.append('<td>' + libellesValeurs[a] + '</td><td>' + libellesValeurs[b] + '</td><td>' + libellesValeurs[c] + '</td>');
                for (var i in operateurs) {
                    var operateur = operateurs[i];
                    $tr.append('<td>' + libellesValeurs[operateur.Calculer(null,[a,b,c])] + '</td>');
                }
            }
        }
    }
}

$(document).ready(function() {

    // Remplir les select de valeurs
    $('select.valeurs').each(function() {
        for (var i=0; i<4; i++)
            $(this).append('<option value="' + i + '" class="v' + i + '">' + + '</option>');
        $(this).val($(this).attr('defaut'));
    });

    // Afficher les jeux de libellés de valeurs
    var html = $('.jeuxnomsvaleurs').html();
    for (var i in JeuxLibellesValeurs) {
        html += '<br><a href="#" jeuvaleur="' + i + '">' + i + '</a>';
    }
    $('.jeuxnomsvaleurs').html(html);

    $('a[jeuvaleur]').on('click', function() {
        libellesValeurs = JeuxLibellesValeurs[$(this).attr('jeuvaleur')];
        AfficherLibellesValeurs();
        ResoudreProblemes();
    })

    $('input[name=details]').on('change', function() {
        CalculsDetailles = $(this).is(':checked');
        ResoudreProblemes();
    });

    // Permettre de déplier les paramètres des opérateurs
    $('div.operateur').each(function() {
        var $operateur = $(this);
        $operateur.find('h4').append('<span class="toggler"> &#9658;</span>').css('cursor', 'pointer').on('click', function() {
            $depliable = $operateur.find('.depliable');
            $operateur.find('.toggler').remove();
            if ($depliable.is(':visible')) {
                $depliable.hide();
                $operateur.find('h4').append('<span class="toggler"> &#9658;</span>')
            } else {
                $depliable.show();
                $operateur.find('h4').append('<span class="toggler"> &#9660;</span>')
            }
        });
    });

    // Afficher les problèmes
    for (var probleme of Problemes)
        probleme.AppendHtmlTo($('div.problemes'));

    AfficherLibellesValeurs();
    AfficherLibellesOperateurs();

    // Observer les changements de symbole des opérateurs
    $('input.symboleoperateur').on('change keypress keyup', function() {
        var operateur = Operateur.GetFromClasse($(this).attr('name'));
        if (operateur != null) operateur.Symbole = $(this).val();
        AfficherLibellesOperateurs();
    })

    // Observer les changements de définition des opérateurs
    $('div.definitions select').on('change', function() {
        var name = $(this).attr('name').split('-');
        var nomOperateur = name.shift(); // Premier élément
        var operateur = Operateur.GetFromClasse(nomOperateur);
        var args = name; // Autres éléments
        switch (operateur.Arite) {
            case 1:
                operateur.Valeurs[parseInt(args[0][1], 10)] = parseInt($(this).val(), 10);
                break;
            case 2:
                operateur.Valeurs[parseInt(args[0][1], 10)][parseInt(args[1][1], 10)] = parseInt($(this).val(), 10);
                break;
        }
        ResoudreProblemes();
    });

    ResoudreProblemes();

});