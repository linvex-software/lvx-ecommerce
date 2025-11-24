import { Input } from "@/components/ui/input";
import { useCheckoutStore } from "@/lib/store/useCheckoutStore";
import { useState } from "react";

const CheckoutForm = () => {
    const { formData, setFormData } = useCheckoutStore();
    const [isLoadingCep, setIsLoadingCep] = useState(false);
    const [cepError, setCepError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ [name]: value });
    };

    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');

        if (cep.length !== 8) {
            setCepError("CEP deve conter 8 dígitos.");
            return;
        }

        setCepError("");
        setIsLoadingCep(true);

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                setCepError("CEP não encontrado.");
                return;
            }

            setFormData({
                address: data.logradouro,
                neighborhood: data.bairro,
                city: data.localidade,
                state: data.uf,
            });
        } catch (error) {
            setCepError("Erro ao buscar CEP.");
        } finally {
            setIsLoadingCep(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dados do Cliente</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium">Nome Completo</label>
                    <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Seu nome completo"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label htmlFor="cpf" className="text-sm font-medium">CPF</label>
                    <Input
                        id="cpf"
                        name="cpf"
                        placeholder="000.000.000-00"
                        value={formData.cpf}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium">Telefone</label>
                    <Input
                        id="phone"
                        name="phone"
                        placeholder="(00) 00000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <h3 className="text-xl font-bold mt-8">Endereço de Entrega</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label htmlFor="zipCode" className="text-sm font-medium">CEP</label>
                    <div className="relative">
                        <Input
                            id="zipCode"
                            name="zipCode"
                            placeholder="00000-000"
                            value={formData.zipCode}
                            onChange={handleChange}
                            onBlur={handleCepBlur}
                            required
                            className={cepError ? "border-red-500" : ""}
                        />
                        {isLoadingCep && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <span className="h-4 w-4 block rounded-full border-2 border-t-transparent border-primary animate-spin"></span>
                            </div>
                        )}
                    </div>
                    {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="address" className="text-sm font-medium">Endereço</label>
                    <Input
                        id="address"
                        name="address"
                        placeholder="Rua, Avenida..."
                        value={formData.address}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label htmlFor="number" className="text-sm font-medium">Número</label>
                    <Input
                        id="number"
                        name="number"
                        placeholder="123"
                        value={formData.number}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2 md:col-span-2">
                    <label htmlFor="complement" className="text-sm font-medium">Complemento</label>
                    <Input
                        id="complement"
                        name="complement"
                        placeholder="Apto, Bloco..."
                        value={formData.complement}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label htmlFor="neighborhood" className="text-sm font-medium">Bairro</label>
                    <Input
                        id="neighborhood"
                        name="neighborhood"
                        placeholder="Bairro"
                        value={formData.neighborhood}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="city" className="text-sm font-medium">Cidade</label>
                    <Input
                        id="city"
                        name="city"
                        placeholder="Cidade"
                        value={formData.city}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="state" className="text-sm font-medium">Estado</label>
                    <select
                        id="state"
                        name="state"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.state}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecione</option>
                        <option value="AC">AC</option>
                        <option value="AL">AL</option>
                        <option value="AP">AP</option>
                        <option value="AM">AM</option>
                        <option value="BA">BA</option>
                        <option value="CE">CE</option>
                        <option value="DF">DF</option>
                        <option value="ES">ES</option>
                        <option value="GO">GO</option>
                        <option value="MA">MA</option>
                        <option value="MT">MT</option>
                        <option value="MS">MS</option>
                        <option value="MG">MG</option>
                        <option value="PA">PA</option>
                        <option value="PB">PB</option>
                        <option value="PR">PR</option>
                        <option value="PE">PE</option>
                        <option value="PI">PI</option>
                        <option value="RJ">RJ</option>
                        <option value="RN">RN</option>
                        <option value="RS">RS</option>
                        <option value="RO">RO</option>
                        <option value="RR">RR</option>
                        <option value="SC">SC</option>
                        <option value="SP">SP</option>
                        <option value="SE">SE</option>
                        <option value="TO">TO</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default CheckoutForm;
