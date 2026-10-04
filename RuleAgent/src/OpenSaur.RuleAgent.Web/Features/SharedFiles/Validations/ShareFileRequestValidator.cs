using FluentValidation;
using OpenSaur.RuleAgent.Web.Features.SharedFiles.Dtos;

namespace OpenSaur.RuleAgent.Web.Features.SharedFiles.Validations;

public sealed class ShareFileRequestValidator : AbstractValidator<ShareFileRequest>
{
    public ShareFileRequestValidator()
    {
        RuleFor(x => x.FileNodeId)
            .NotEmpty().WithMessage("File node ID is required.");
    }
}
